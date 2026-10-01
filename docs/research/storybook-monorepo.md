# Storybook placement, shared UI tiers and framework-agnostic components

Date: 2026-09-29. Status: research input. The decision it fed is
[ADR 0004](../adr/0004-packages-ui-is-the-design-system.md).

## 1. Question and scope

Derby wanted to (1) move reusable presentational components (`WinLoss`, `RankTag` with a crest image,
`PageShell`, `PageHeader`, `RelativeTime`) into `packages/ui`, splitting logic-heavy components into an
app-side container and a props-only view, and (2) move Storybook out of `apps/app` into its own
`apps/storybook` workspace that renders only `packages/ui`.

Eight questions, answered from primary sources: Storybook in monorepos; Turborepo's layouts; shadcn/ui's
monorepo conventions; Tailwind v4 source detection; Next-specific imports in a shared package; naming the
tier above primitives; i18n and navigation in stories; the container/presentational split.

Versions: Storybook docs from `main` (package 10.6.0; Storybook 11 notes from `next`, marked prerelease),
Tailwind CSS v4, Turborepo `main`, shadcn/ui `main`, Next.js `canary`.

**Quote fidelity.** Storybook, Turborepo, shadcn, Tailwind, Radix, Next.js, npm, React, Vite and
next-international were read from their docs' source files on GitHub (raw MDX/MD or source code), so quotes
are verbatim. GOV.UK, Primer, Panda CSS, Chakra, Atomic Design, MUI and Atlassian came back through a fetch
tool that summarises the page: treat those as near-verbatim, flagged "(fetch-summarised)". Checks of the
Derby repo are marked "(repo observation)".

## 2. Findings

### 2.1 Storybook in a monorepo

- **No dedicated monorepo guidance.** The docs mention monorepos only incidentally: the FAQ on module
  resolution ("If your project is set up within a monorepo, or uses a package manager with a non-standard
  `node_modules` layout (such as pnpm)…") and an Angular note [S3]. No page says where Storybook should
  live. The upgrade command will "Find all of the Storybook projects in your repository" [S7].
- **`stories` with directory specifiers** [S1]: `{ directory: string; files?: string; titlePrefix?: string }`.
  `directory` is "Where to start looking for story files, relative to the root of your project"; `files`
  defaults to `'**/*.@(mdx|stories.@(js|jsx|mjs|ts|tsx))'`; `titlePrefix` is prepended under auto-titling.
  The official snippet points outside the config directory (`directory: '../packages/components'`).
  - Doc inconsistency: the Configure page says `stories` globs are "relative to `main.js`" [S2]. Derby's
    working `../../../packages/ui/src` behaves as config-relative.
  - Storybook's "intention is for you to colocate a story file along with the component it documents"
    [S1][S2].
- **Composition (`refs`)**: browse "any Storybook accessible via URL" [S4]. Verbatim warning: "Addons in
  composed Storybooks will not work as they normally do in a non-composed Storybook." [S4] Package
  composition recommends publishing to Chromatic [S5].
- **Storybook 10** is "a breaking maintenance release focused on ESM-only package distribution" [S7].
  `main.*` must be valid ESM; `require`, `__dirname` and `__filename` "will not be defined"; `moduleResolution`
  must be `bundler`, `node16` or `nodenext`; Node 20.19+ or 22.12+ [S7][S8]. Storybook 11 (prerelease) raises
  the floors to Node 22.12, Vite 6.3 and Next.js 15, and deprecates the webpack `@storybook/nextjs`, not
  `nextjs-vite` [S9].
- **Framework choice** [S10][S11][S19]
  - `@storybook/react-vite`: React ≥ 16.8, Vite ≥ 5 [S11].
  - `@storybook/nextjs-vite`: "the **recommended** framework… for Next.js applications", Next ≥ 14.1, with
    `next` as a peer dependency [S10][S19]. It renders `next/image` "with no configuration", partially
    supports `next/font`, stubs `next/navigation` and `next/router`, and ships `navigation`/`router`/
    `headers`/`cache` mocks [S10]. The source also has an undocumented `./link.mock` [S19].
  - No page says which framework to use for a library package; the docs are written per application type.
- **Tailwind v4 in a Vite Storybook**: Storybook merges the project's Vite config [S12] and "Vite comes with
  PostCSS support out-of-the-box"; global CSS goes in `.storybook/preview.tsx` [S13]. With `nextjs-vite`,
  "Storybook will automatically handle the PostCSS config for you" [S10]. Tailwind recommends
  `@tailwindcss/vite` for Vite projects [S37]. Storybook's own Tailwind recipe predates v4 [S14].
- **Vite `server.fs.allow`** defaults to the workspace root, found through a `workspaces` field [S20], so
  `apps/storybook` can serve `packages/ui` without configuration.

### 2.2 Turborepo

- **Storybook guide** [S21]: "You'll need a directory for the Storybook application: `mkdir apps/storybook`."
  Co-located stories are a documented variant: `stories: ["../../../packages/ui/src/**/*.stories.*"]` with
  `@storybook/react` in the UI package. Caching: exclude stories from `build` inputs
  (`"!**/*.stories.{tsx,jsx,mdx}"`) so "changing a story doesn't mean your production applications should
  miss cache". "If your UI package exports its own CSS, you'll need to add it to… `.storybook/preview.ts`".
- **`design-system` example** (community-maintained) [S25]: `apps/docs` with Storybook 8.2 and
  `react-vite`, stories in the docs app, a compiled `packages/ui` with one export per component.
- **`with-tailwind` example** (core team) [S26]: a compiled `ui` with a `ui-` prefix; for source
  consumption, "add `@source` directives to the CSS entry point in your apps".
- **Just-in-Time packages** [S22]: "compiled by the application that uses it"; "**No TypeScript `paths`**";
  "Turborepo cannot cache a build for a Just-in-Time Package".
- **Structure** [S23]: `apps/` for applications, `packages/` for everything else; "Turborepo does not
  support nested packages", so a folder inside a package must not have its own `package.json`.

### 2.3 shadcn/ui in a monorepo

- Run `add` "in the path of your app": `add button` installs under `packages/ui`; `add login-01` installs
  the primitives under `packages/ui` "and the `login-form` component under `apps/web/components`" [S28].
  Primitives go to the package, blocks to the app.
- Every workspace needs a `components.json`; the CLI uses `aliases.ui` to place primitives [S28][S29].
- Registry types: `registry:block` ("complex components with multiple files"), `registry:component`
  ("simple components"), `registry:ui` ("UI components and single-file primitives") [S30].
- The `next-monorepo` template uses wildcard exports (`"./components/*"`) and puts
  `@source "../../../apps/**/*.{ts,tsx}"` in the UI package's own stylesheet [S32].
- shadcn has no official notion of blocks living inside the shared package.

### 2.4 Tailwind CSS v4 class detection [S35][S36]

- Automatic scanning skips `.gitignore`d files, `node_modules`, binaries, CSS and lock files.
- "Tailwind uses the current working directory as its starting point"; `source("../src")` sets the base.
  (Repo observation: `@tailwindcss/postcss` falls back to `process.cwd()`, so `packages/ui/README.md`'s
  "anchored at the file holding the import" was wrong.)
- `@source` paths are "relative to the stylesheet". `@source not` ignores paths; the docs only show a
  directory, not a glob.
- Unknown tokens are dropped silently.
- Derby's two consumers already use recursive globs over `packages/ui/src` (repo observation), so a new
  folder under `src/` is picked up by both; stories there add their classes to both apps' CSS too.

### 2.5 Next-specific imports in a shared package

- **Slot / `asChild`**: "When `asChild` is set to `true`, Radix will not render a default DOM element,
  instead cloning the part's child" [S38][S39]; shadcn's Button example wraps `next/link` from the
  consumer [S33]. The Base UI variant says to use `buttonVariants` on a plain `<a>` for links [S34].
- **Injected link components**: MUI's `LinkComponent` in theme `defaultProps` (fetch-summarised) [S40];
  React Spectrum's `Provider router={{navigate, useHref}}` [S41].
- **Peer dependency**: expresses "compatibility of your package with a host tool or library" [S43].
  Turbopack transpiles workspace packages automatically [S44].
- **Static export** does not support "Image Optimization with the default `loader`" [S45]; `apps/lcu` uses
  `output: "export"` (repo observation).
- Storybook can automock any module with `sb.mock`, registered in `preview.*` [S17].

### 2.6 Naming the tier above primitives

| System | Term | Meaning |
|---|---|---|
| shadcn/ui | blocks | "building blocks. Copy and paste into your apps"; the CLI installs them into the app [S31][S28] |
| GOV.UK | components vs patterns | patterns are "best practice design solutions for specific user-focused tasks" — guidance, not code (fetch-summarised) [S53][S54] |
| Primer | UI patterns | "Design guidelines covering common user workflows" (fetch-summarised) [S55] |
| Panda CSS | recipes | "a way to create multi-variant styles with a type-safe runtime API" (fetch-summarised) [S57] |
| Chakra UI | recipes | `className`, `base`, `variants`, `compoundVariants`, `defaultVariants` (fetch-summarised) [S58] |
| Atomic Design | molecules / organisms | groups of atoms / groups of molecules (fetch-summarised) [S59] |

None of these is a standard name for a folder of reusable, data-free composites, so the choice is a local
convention and should be written down.

### 2.7 i18n and navigation in stories

- Storybook's "Pure presentational pages": do "the messy 'connected' logic in a single wrapper component in
  your app outside of Storybook", so "All the data for the story is encoded in the args" [S15]. Connected
  components get a provider decorator instead [S16]. The toolbars page uses a `locale` global as its
  example [S18].
- next-international has no Storybook page; its testing page wraps components in the provider [S49].
  `useCurrentLocale` reads `useParams()[segmentName ?? 'locale']` and calls `notFound()` otherwise; the
  client provider imports `next/navigation` [S50].
- (Repo observation) `createI18nClient` creates a context per call, but `localesCache` is module-level and
  keyed only by locale, so two clients in one app share one dictionary per locale.
- `nextjs-vite`: `useParams` needs `parameters.nextjs.navigation.segments` and `appDirectory: true` [S10].

### 2.8 Container / presentational split

- Abramov's original definitions: presentational components "Receive data and callbacks exclusively via
  props"; containers "Provide the data and behavior" [S51]. His 2019 note: "I don't suggest splitting your
  components like this anymore… I've seen it enforced without any necessity and with almost dogmatic
  fervor far too many times… Hooks let me do the same thing without an arbitrary division." [S51]
- React: custom hooks "hide the gnarly details"; "You don't need to extract a custom Hook for every little
  duplicated bit of code" [S52].
- Storybook still documents the split as the way to avoid mocking: "it requires a strict split of the
  container and presentational component logic" [S15].

## 3. Implications for Derby

1. `apps/storybook` is the layout of Turborepo's own guide [S21]; co-located stories are its documented
   variant, and its cache advice (exclude stories from `build` inputs) applies unchanged. Composition is
   not needed.
2. The framework follows from what `packages/ui` imports: game-asset views using `next/image` keep
   `nextjs-vite` [S10].
3. `apps/lcu` is a static export, so a view hard-wired to `next/image` must stay out of it [S45].
4. Locale-aware views depending on `useCurrentLocale` are tied to `next/navigation` [S50]; a provider of
   their own removes that and makes the locale a Storybook global [S18].
5. The folder name is a local convention (2.6).
6. A new folder under `packages/ui/src` needs no new `@source` line in either app (2.4).
7. JIT packages cannot use TypeScript `paths` [S22]: moved files lose their `@/…` imports.
8. Storybook 10 needs an ESM `main.ts` and `moduleResolution: "bundler"` [S8].
9. Split only the components that need hooks or Next; the sources warn against splitting everything
   [S51][S52].

## 4. Open questions

- Is `stories.directory` relative to the config dir or the project root? The docs contradict each other
  [S1][S2]; Derby's config works config-relative.
- Does `@source not` accept a glob like `"../**/*.stories.tsx"`? [S35]
- Is `nextjs-vite`'s `link.mock` applied automatically, and since which 10.x? [S19]

## 5. Sources

- [S1] https://storybook.js.org/docs/api/main-config/main-config-stories
- [S2] https://storybook.js.org/docs/configure
- [S3] https://storybook.js.org/docs/faq#how-do-i-fix-module-resolution-in-special-environments
- [S4] https://storybook.js.org/docs/sharing/storybook-composition
- [S5] https://storybook.js.org/docs/sharing/package-composition
- [S6] https://storybook.js.org/docs/api/main-config/main-config-refs
- [S7] https://storybook.js.org/docs/releases/migration-guide
- [S8] https://github.com/storybookjs/storybook/blob/main/MIGRATION.md
- [S9] https://github.com/storybookjs/storybook/blob/next/MIGRATION.md
- [S10] https://storybook.js.org/docs/get-started/frameworks/nextjs-vite
- [S11] https://storybook.js.org/docs/get-started/frameworks/react-vite
- [S12] https://storybook.js.org/docs/builders/vite
- [S13] https://storybook.js.org/docs/configure/styling-and-css
- [S14] https://storybook.js.org/recipes/tailwindcss (fetch-summarised)
- [S15] https://storybook.js.org/docs/writing-stories/build-pages-with-storybook
- [S16] https://storybook.js.org/docs/writing-stories/mocking-data-and-modules/mocking-providers
- [S17] https://storybook.js.org/docs/writing-stories/mocking-data-and-modules/mocking-modules
- [S18] https://storybook.js.org/docs/essentials/toolbars-and-globals
- [S19] https://github.com/storybookjs/storybook/tree/main/code/frameworks/nextjs-vite
- [S20] https://vite.dev/config/server-options#server-fs-allow
- [S21] https://turborepo.dev/docs/guides/tools/storybook
- [S22] https://turborepo.dev/docs/core-concepts/internal-packages
- [S23] https://turborepo.dev/docs/crafting-your-repository/structuring-a-repository
- [S25] https://github.com/vercel/turborepo/tree/main/examples/design-system
- [S26] https://github.com/vercel/turborepo/tree/main/examples/with-tailwind
- [S28] https://ui.shadcn.com/docs/monorepo
- [S29] https://ui.shadcn.com/docs/components-json
- [S30] https://ui.shadcn.com/docs/registry/registry-item-json
- [S31] https://ui.shadcn.com/blocks
- [S32] https://github.com/shadcn-ui/ui/tree/main/templates/next-monorepo
- [S33] https://ui.shadcn.com/docs/components/radix/button
- [S34] https://ui.shadcn.com/docs/components/base/button
- [S35] https://tailwindcss.com/docs/detecting-classes-in-source-files
- [S36] https://tailwindcss.com/docs/functions-and-directives#source-directive
- [S37] https://tailwindcss.com/docs/installation/using-vite
- [S38] https://www.radix-ui.com/primitives/docs/guides/composition
- [S39] https://www.radix-ui.com/primitives/docs/utilities/slot
- [S40] https://mui.com/material-ui/integrations/routing/ (fetch-summarised)
- [S41] https://react-spectrum.adobe.com/react-spectrum/routing.html
- [S43] https://docs.npmjs.com/cli/configuring-npm/package-json#peerdependencies
- [S44] https://nextjs.org/docs/app/api-reference/config/next-config-js/transpilePackages
- [S45] https://nextjs.org/docs/app/guides/static-exports
- [S49] https://next-international.vercel.app/docs/testing
- [S50] https://github.com/QuiiBz/next-international/tree/main/packages/next-international/src
- [S51] https://web.archive.org/web/2024/https://medium.com/@dan_abramov/smart-and-dumb-components-7ca2f9a7c7d0
  (Medium returned 403)
- [S52] https://react.dev/learn/reusing-logic-with-custom-hooks
- [S53] https://design-system.service.gov.uk/components/ (fetch-summarised)
- [S54] https://design-system.service.gov.uk/patterns/ (fetch-summarised)
- [S55] https://primer.style/product/ui-patterns/ (fetch-summarised)
- [S57] https://panda-css.com/docs/concepts/recipes (fetch-summarised)
- [S58] https://chakra-ui.com/docs/theming/recipes (fetch-summarised)
- [S59] https://atomicdesign.bradfrost.com/chapter-2/ (fetch-summarised)

Could not reach: https://atlassian.design/patterns (rendered client-side) and
https://polaris.shopify.com/patterns (redirect, then a socket error).
