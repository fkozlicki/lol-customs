# 0005 — One i18n runtime: next-intl, with the design system's messages in the app's dictionary

- Status: accepted
- Date: 2026-09-29

## Context

ADR 0004 gave the recipes in `packages/ui` their own messages. The first way they reached the page was a
second translation runtime: the app translated with next-international, and the recipes with a small
formatter of their own behind a second React context, `RecipesI18nProvider`. The layout mounted both.
Two interfaces for one capability, two `t` implementations to keep in step, two providers for every
consumer (the app, Storybook, a test) to remember.

That shape was forced by next-international. Each `createI18nClient` makes its own context, but the
dictionaries are cached per module, keyed only by locale (`localesCache`), so a second client for the
recipes would read whichever dictionary loaded first. It has no way to compose dictionaries either; the
maintainer calls that "one of the limitation of next-international" (issue #267, still open). Its last
release, 1.3.1, is from 31 October 2024, and its repository has had no commits since.

## Decision

1. **next-intl is the only translation runtime.** The app renders one `NextIntlClientProvider` in
   `app/[locale]/layout.tsx`; rendered from a Server Component, it inherits the locale and messages from
   `src/i18n/request.ts`. Server Components use `getTranslations`, client components `useTranslations`.
2. **One dictionary, composed flat.** `packages/ui/src/recipes/messages` exports the recipes' messages per
   locale; `apps/app/src/i18n/messages.ts` spreads them beside the app's own
   (`{ ...recipes, ...app }`). Top-level keys on the two sides must differ, and the compose function's
   type makes a shared one a compile error, since a shallow spread would otherwise let one side silently
   replace the other.
3. **Recipes import `useTranslations` and `useLocale` from `next-intl`**, a peer dependency of
   `packages/ui`, so the app and the design system share one package and therefore one React context.
4. **Storybook renders the same provider** with only the recipes' messages and the toolbar's locale.
5. **The locale cookie keeps its name.** `localePrefix: "never"` reproduces next-international's
   `urlMappingStrategy: "rewrite"`, and `localeCookie: { name: "Next-Locale", maxAge: one year }` keeps
   the choice people already made.

## Why

- **One seam, two adapters.** Translation is now one interface (`useTranslations` over one context)
  with two providers of it — the app and Storybook — instead of two interfaces that each needed their own.
- **It is the documented pattern.** next-intl's guide for monorepos and external packages ships messages
  with the package and merges them in `getRequestConfig`; the design system is exactly that package.
- **The shared context is structural.** `NextIntlClientProvider` renders use-intl's `IntlProvider`, and
  use-intl creates its one context at module level; one installed copy means one context.

Considered and rejected:

- **Labels as props.** One runtime without touching the app's library, but a recipe's words would live in
  every container that renders it — a scoreboard takes a dozen — far from the recipe.
- **A context of the design system's own, fed by the app.** Still two providers, only renamed.
- **`use-intl` instead of `next-intl` in the package.** Keeps Next out of the package's i18n, but recipes
  would have to be Client Components, and the app and the package would have to resolve the same copy
  of use-intl by hand. `packages/ui` already depends on Next for `next/image`.

## Consequences

- A string a recipe renders goes into `packages/ui/src/recipes/messages`, anything else into
  `apps/app/src/locales`. A new top-level key cannot reuse a name from the other side.
- Messages are ICU now. `{param}` is unchanged, but an apostrophe right before `{` or `<` starts quoted
  text, and React elements go through `t.rich` with tags, not as plain values.
- Typed keys come from one `AppConfig` augmentation per TypeScript program: the app declares the composed
  dictionary, and `packages/ui` and `apps/storybook` each declare the recipes' part, in files nothing
  imports, so two declarations never meet in one program.
- Revisit if Derby Sync starts rendering recipes: it would need the same provider and the recipes'
  messages.
