# One i18n runtime for the app and the design system: next-intl vs next-international

Date: 2026-09-29. Status: research input. The decision it fed is
[ADR 0005](../adr/0005-one-i18n-runtime-next-intl.md).

## 1. Question and scope

Can Derby replace next-international 1.3.1 and the design system's own `RecipesI18nProvider` with one
translation runtime and one provider, where `packages/ui` owns its messages, the app composes them into its
dictionary, and recipes and Storybook use a standard hook?

Everything below was read as raw source (MDX and TypeScript on GitHub, the GitHub API, npm registry JSON);
no fetch tool summarised it. References like [S1] point to section 5.

## 2. Findings

### 2.1 next-intl: status, Next 16, `proxy.ts`

- Latest 4.14.8, published 2026-09-29, with eight patch releases in the month before [S1]. Peers:
  `next: "^12.0.0 || … || ^16.0.0"` [S1]. 4.4.0 (2025-10-22) was the "Next.js 16 update" [S2].
- The docs use `src/proxy.ts`: "`proxy.ts` was called `middleware.ts` up until Next.js 16." [S4][S5]

### 2.2 App Router APIs

- `getRequestConfig` in `src/i18n/request.ts`, wired through `createNextIntlPlugin()`; the config "is created
  once for each request by internally using React's `cache`" [S3][S8].
- `defineRouting({locales, defaultLocale})` in `src/i18n/routing.ts`; `createMiddleware(routing)` in the
  proxy; `createNavigation(routing)` for `Link`, `useRouter`, `usePathname` [S4].
- The current `request.ts` reads the locale from `next/root-params`: "available by default in Next.js 16.3
  and later. In earlier versions, it needs to be enabled via `experimental.rootParams`" [S4]. The
  `requestLocale` parameter is "considered legacy and is no longer recommended" (deprecated in 4.13.6)
  [S2][S8].
- `useTranslations('ns')` in non-async components, `await getTranslations('ns')` in async ones; namespaces
  nest (`'auth.SignUp'`); "Namespace keys cannot contain the character '.'" [S3][S9]. `useLocale()` /
  `getLocale()` [S8]. Switching: `router.replace(pathname, {locale})` [S7].

### 2.3 Provider inheritance (v4)

- "These props are inherited if you're rendering `NextIntlClientProvider` from a Server Component: `locale`,
  `messages`, `now`, `timeZone`, `formats`" [S8]. The server export fills in
  `locale ?? (await getLocale())` and `messages === undefined ? await getMessages() : messages` [S21].
- Rendered from a client component (Storybook, tests) there is nothing to inherit, and it throws "Couldn't
  infer the `locale` prop" [S20]. Nested providers inherit, but "`messages` need to be merged manually" [S8].

### 2.4 Proxy composition and locale cookie

- "you can either modify the request before the `next-intl` middleware receives it, modify the response or
  even create the middleware based on dynamic configuration" [S5]. `createMiddleware` returns
  `(request) => NextResponse` [S5].
- next-international's `urlMappingStrategy: 'rewrite'` corresponds to `localePrefix: 'never'`: requests are
  "rewritten to have the locale only prefixed internally. You still need to place all your pages inside a
  `[locale]` folder" [S6].
- next-intl's cookie is a session cookie named `NEXT_LOCALE`, set only when the chosen locale differs from
  `accept-language`; `localeCookie: {name, maxAge}` changes both [S6][S16]. next-international's is
  `Next-Locale` [S44].

### 2.5 One React context

- "`next-intl` internally uses a library called `use-intl`" [S12]. Its client entry re-exports use-intl's
  hooks [S19]; `NextIntlClientProvider` returns use-intl's `IntlProvider` [S20]; use-intl creates its one
  context at module level: `const IntlContext = createContext<IntlContextValue | undefined>(undefined)` [S23].
- Shared UI packages in monorepos fail with "No intl context found" when "multiple or different copies of
  `next-intl`, `use-intl` or `react` end up in your bundle" (maintainer) [S29].
- For shared components: "it can be beneficial to import from `next-intl` … to benefit from the Server
  Components integration … In other environments, imports to `next-intl` will work as well, but will require
  `IntlProvider` to be present." [S12]

### 2.6 Messages from a package

- The "Monorepos and external packages" guide offers "Ship messages with the external package", merged in
  `getRequestConfig`: `{...(await import('@acme/ui/messages/…')).default, ...(await
  import('../../messages/…')).default}`, and adds "To avoid key collisions between packages, you can consider
  using namespaces." [S14]

### 2.7 Types

- v4: `declare module 'next-intl' { interface AppConfig { Locale; Messages; Formats } }` [S10]. `AppConfig`
  is one interface declared in use-intl; next-intl re-exports `use-intl/core`, so both module names patch the
  same interface [S19][S26]. TypeScript: non-function members declared twice "must be of the same type" [S36].
- A library and an app declaring different `Messages` in one program collide; the maintainer's advice is that
  "each package should be able to define messages and make sure types don't leak into other packages"
  (discussion #1224, unresolved) [S30].

### 2.8 ICU and rich text

- `{name}` is unchanged; `#` means something only inside `plural`/`selectordinal` [S9][S34].
- Since ICU 4.8, "an ASCII apostrophe only starts quoted text if it immediately precedes a character that
  requires quoting" [S35]: `don't` is safe, `'{player}'` renders `{player}` literally.
- Plain `t()` takes `Record<string, string | number | Date>`; React elements need `t.rich` with tags [S9][S25].

### 2.9 Storybook

- A global decorator with `NextIntlClientProvider locale messages`; non-async components "will consume
  configuration from `NextIntlClientProvider`" [S11]. Switching locale: a Storybook global, "the decorators
  rerun with the new values" [S33]. Without `timeZone`, date formatting reports `ENVIRONMENT_FALLBACK` [S55].

### 2.10 next-international

- npm latest 1.3.1, 2024-10-31; no `peerDependencies`; last commits 2024-10-31 and 2024-10-28 ("support
  `next@15`"); 103 open issues; community PRs from 2026-09 unmerged [S38][S39]. On "This project is abandoned?"
  (2025-09) a user answered "Think so, next-intl seems way more active currently", with no maintainer reply
  [S41].
- Composing dictionaries: "Indeed, that's currently one of the limitation of next-international." (#267,
  open); "Support for multiple scopes" (#392, open) [S42].
- `localesCache` is `new Map<string, …>()` at module level, read by every client's provider and written by
  `useChangeLocale`, while each `createI18nClient` creates its own context [S43].

### 2.11 How other libraries ship strings

- **React Aria**: owns its strings ("localized strings for 30+ languages") and takes the locale from an
  `I18nProvider`; strings never enter the app's catalog [S46][S47][S48].
- **MUI**: ships locale packs the app composes into its theme (`createTheme({...}, zhCN)`), a mechanism
  separate from the app's i18n library [S50][S51].
- **Radix / shadcn**: no strings; labels are props ("An author-localized label…") [S52][S53].

## 3. Implications for Derby

1. One runtime and one provider is possible with documented APIs: `packages/ui` exports its messages, the
   app's `request.ts` composes them, one `NextIntlClientProvider` inherits them, recipes call
   `useTranslations` [S8][S14][S21].
2. A flat spread is shallow, so a top-level key on both sides silently wins for one of them; guard it with a
   type (or use a namespace) [S14].
3. Import hooks from `next-intl` as a peer of `packages/ui`, and check that one copy of next-intl and use-intl
   is installed [S12][S29].
4. One `AppConfig` augmentation per TypeScript program [S30][S36].
5. `localePrefix: 'never'` plus `localeCookie: {name: 'Next-Locale', maxAge}` keeps today's URLs and people's
   choice (inference from [S6][S44]).
6. Migration mapping (no official guide exists): `useScopedI18n` → `useTranslations`; `getScopedI18n` →
   `getTranslations`; `useCurrentLocale` → `useLocale`; `useChangeLocale` → `router.replace(pathname,
   {locale})`; `getStaticParams` → `routing.locales.map(...)`; `createI18nMiddleware({urlMappingStrategy:
   'rewrite'})` → `createMiddleware(defineRouting({localePrefix: 'never'}))` [S3][S4][S5][S6][S7][S8][S9].

## 4. Open questions

- Does `experimental.rootParams` work on Next 16.1 with next-intl 4.14, or is `requestLocale` simpler until
  16.3?
- With `localePrefix: 'never'`, does `router.replace(pathname, {locale})` update the cookie, or is a
  `forcePrefix` redirect needed [S7]?
- Does `AppConfig.Messages` typing hold for `as const` objects? Nothing documents it; verify with a type test.

## 5. Sources

- [S1] https://registry.npmjs.org/next-intl
- [S2] https://github.com/amannn/next-intl/blob/main/CHANGELOG.md
- [S3] https://github.com/amannn/next-intl/blob/main/docs/src/pages/docs/getting-started/app-router.mdx
- [S4] https://github.com/amannn/next-intl/blob/main/docs/src/pages/docs/routing/setup.mdx
- [S5] https://github.com/amannn/next-intl/blob/main/docs/src/pages/docs/routing/middleware.mdx
- [S6] https://github.com/amannn/next-intl/blob/main/docs/src/pages/docs/routing/configuration.mdx
- [S7] https://github.com/amannn/next-intl/blob/main/docs/src/pages/docs/routing/navigation.mdx
- [S8] https://github.com/amannn/next-intl/blob/main/docs/src/pages/docs/usage/configuration.mdx
- [S9] https://github.com/amannn/next-intl/blob/main/docs/src/pages/docs/usage/translations.mdx
- [S10] https://github.com/amannn/next-intl/blob/main/docs/src/pages/docs/workflows/typescript.mdx
- [S11] https://github.com/amannn/next-intl/blob/main/docs/src/pages/docs/workflows/storybook.mdx
- [S12] https://github.com/amannn/next-intl/blob/main/docs/src/pages/docs/environments/core-library.mdx
- [S14] https://github.com/amannn/next-intl/blob/main/docs/src/pages/docs/usage/extraction.mdx
- [S16] https://github.com/amannn/next-intl/blob/main/docs/src/pages/blog/next-intl-4-0.mdx
- [S19] https://github.com/amannn/next-intl/blob/main/packages/next-intl/src/react-client/index.tsx
- [S20] https://github.com/amannn/next-intl/blob/main/packages/next-intl/src/shared/NextIntlClientProvider.tsx
- [S21] https://github.com/amannn/next-intl/blob/main/packages/next-intl/src/react-server/NextIntlClientProviderServer.tsx
- [S23] https://github.com/amannn/next-intl/blob/main/packages/use-intl/src/react/IntlContext.tsx
- [S25] https://github.com/amannn/next-intl/blob/main/packages/use-intl/src/core/TranslationValues.tsx
- [S26] https://github.com/amannn/next-intl/blob/main/packages/use-intl/src/core/AppConfig.tsx
- [S29] https://github.com/amannn/next-intl/issues/111
- [S30] https://github.com/amannn/next-intl/discussions/1224
- [S33] https://github.com/storybookjs/storybook/blob/next/docs/essentials/toolbars-and-globals.mdx
- [S34] https://github.com/formatjs/formatjs/blob/main/docs/src/docs/core-concepts/icu-syntax.mdx
- [S35] https://unicode-org.github.io/icu/userguide/format_parse/messages/
- [S36] https://github.com/microsoft/TypeScript-Website/blob/v2/packages/documentation/copy/en/reference/Declaration%20Merging.md
- [S38] https://registry.npmjs.org/next-international
- [S39] https://github.com/QuiiBz/next-international/commits/main
- [S41] https://github.com/QuiiBz/next-international/issues/359
- [S42] https://github.com/QuiiBz/next-international/issues/267, https://github.com/QuiiBz/next-international/issues/392
- [S43] https://github.com/QuiiBz/next-international/blob/main/packages/next-international/src/app/client/create-i18n-provider-client.tsx
- [S44] https://github.com/QuiiBz/next-international/blob/main/packages/next-international/src/common/constants.ts
- [S46] https://github.com/adobe/react-spectrum/blob/main/packages/dev/s2-docs/pages/react-aria/quality.mdx
- [S47] https://github.com/adobe/react-spectrum/blob/main/packages/react-aria/src/i18n/useLocalizedStringFormatter.ts
- [S48] https://github.com/adobe/react-spectrum/blob/main/docs/contributing/i18n-strings.md
- [S50] https://github.com/mui/material-ui/blob/master/docs/data/material/guides/localization/localization.md
- [S51] https://github.com/mui/mui-x/blob/master/docs/data/data-grid/localization/localization.md
- [S52] https://github.com/radix-ui/website/blob/main/data/primitives/docs/components/toast.mdx
- [S53] https://github.com/shadcn-ui/ui/blob/main/apps/v4/registry/new-york-v4/ui/dialog.tsx
- [S55] https://github.com/amannn/next-intl/blob/main/packages/use-intl/src/core/createFormatter.tsx

Not reached: react-aria.adobe.com's internationalization page redirected; the repository's MDX was read
instead. No official next-international → next-intl migration guide was found.
