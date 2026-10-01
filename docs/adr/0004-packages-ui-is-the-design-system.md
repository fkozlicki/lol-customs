# 0004 — packages/ui is the design system, and Storybook renders only it

- Status: accepted
- Date: 2026-09-29
- Supersedes: [0003](0003-compositions-live-in-the-app.md)
- Amended by: [0007](0007-pages-are-composed-in-the-app.md)

## Context

ADR 0003 split the front end by package: neutral primitives in `packages/ui`, everything visual that knows
about Derby — `RankTag`, `WinLoss`, `PageShell`, the match and forum components — in
`apps/app/src/components`. The Storybook that documents both therefore had to run inside the app, and it
inherited the app with it: `@/locales` and its provider, a Next internal (`PathParamsContext`) so
`useCurrentLocale` could find a route segment, a nuqs adapter, and `@/env.mjs` pulled in through tRPC, which
is why `build-storybook` hashed three environment variables. 23 of the 35 app stories depended on i18n, the
query string, `next/*` or `@/…`. A story was a render of a page fragment, not of its props.

The line between "how it looks" and "how it works" existed only as a convention, so components that were
reused had no story and nobody could see what already existed.

## Decision

1. **`packages/ui` is Derby's design system.** It holds two tiers:
   - `src/components/`: neutral shadcn primitives and the token contract, unchanged.
   - `src/recipes/`: Derby's visual components. A **recipe** takes plain props (strings, numbers, hrefs,
     callbacks) and renders; it never fetches, reads the URL or knows a tRPC type.
2. **`apps/app` only uses them.** It keeps the containers (queries, mutations, nuqs, routing) and one mapper
   per data root (for example `toMatchCardView`) that formats values with `@v1/domain` and builds
   season-aware hrefs.
3. **One Storybook, in `apps/storybook`, rendering only `packages/ui`.** The stories live there too,
   in `stories/`, and import `@v1/ui` through its exports, as in Turborepo's design-system example, so a
   story reaches exactly what the app can. It still uses `@storybook/nextjs-vite`, because game-asset
   recipes render through `next/image` (ADR 0002).
4. **Recipes own their messages.** `packages/ui/src/recipes/messages/` holds the English and Polish
   strings recipes render, keyed by concept (`match.victory`, not `dashboard.pages.matchHistory.victory`).
   The app composes them into its one dictionary and recipes read them with next-intl's `useTranslations`
   ([ADR 0005](0005-one-i18n-runtime-next-intl.md)). The app's own messages stay in `apps/app/src/locales`.
5. **"Recipe" now names a component, not a style API.** 0003 used it for the `cva` call inside a component
   file; that call is now called *variants*, as cva (`variants`, `VariantProps`) and shadcn
   (`buttonVariants`) name it.

## Why

- **A story should be its args.** With data, the URL and routing kept in the app, every recipe story is a
  pure function of its props, and the Storybook needs no app code to run.
- **One structural line.** "Visual" and "logic" now live in different packages, so the split is enforced
  by imports rather than remembered.
- **Messages beside the recipes that render them.** A recipe's strings change with the recipe, so they
  live in the same package; how they reach the page is ADR 0005's subject.
- **Why a folder and not a package.** One export map, one `@source` line per consumer, one Storybook
  specifier. What a separate package would have guaranteed structurally is enforced by lint instead (below).

## Consequences

- Recipes may import primitives, `next-intl`'s hooks, `next/image`, `next/link` (with the `href` passed
  in), `motion`, `date-fns`, `react-intersection-observer` and `@tiptap/*`. They may not import `@v1/api`,
  `@v1/domain`, `@v1/supabase`, `@trpc/*`, `nuqs`, `next/navigation`, `next-intl/server`,
  `next-intl/navigation` or `@/…`. Biome's
  `noRestrictedImports` enforces this for `packages/ui/src`, and keeps `apps/storybook` to `@v1/ui`'s
  exports: no data layer, no path into a package or the app.
- **Derby Sync (`apps/lcu`) uses primitives only.** It does not import `tokens.css`, so a recipe's
  `label-caps`, `num` or domain colours would render unstyled there, and it is a static export, where
  `next/image`'s default loader does not work. Lint blocks `@v1/ui/recipes/*` in `apps/lcu`. 0003's
  observation stands; it now guards one folder instead of the whole package.
- `next` is a peer dependency of `packages/ui`.
- A string a recipe renders goes into `packages/ui/src/recipes/messages`; every other string into
  `apps/app/src/locales`. Both need `en` and `pl`, and ADR 0005 says how they are composed.
- Game-asset knowledge — the champion list, URL builders, which patch — is not visual and lives in its
  own package ([ADR 0006](0006-game-assets-are-one-package.md)); the image recipes and the patch provider
  stay here. The self-hosted icons stay in `apps/app/public/game/`, which Next serves and Storybook maps
  with `staticDirs`.
- Revisit the lcu rule if Derby Sync adopts the design system's tokens.
