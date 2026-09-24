# 0003 — Derby's compositions live in the app, not in packages/ui

- Status: accepted
- Date: 2026-09-24

## Context

`packages/ui` is shared by two apps: the dashboard (`apps/app`) and Derby Sync (`apps/lcu`). When the
dashboard grew shapes it builds again and again — a page shell, a rank tag, a win–loss record, a match
card — the natural instinct was to move them into the shared package, perhaps under a `recipes/`
folder, so both apps could use them.

## Decision

`packages/ui` holds **neutral primitives and the token contract**: a button, a dialog, a table, and
`tokens.css`. Anything that encodes Derby's domain — `RankTag`, `WinLoss`, `PageShell`, the match and
forum components — lives in `apps/app/src/components/`.

A component's variants are a `cva` recipe **inside the component file**, as shadcn's own `button.tsx`
and `badge.tsx` do. There is no `recipes/` folder.

## Why

- **It is the split the tools already make.** shadcn's monorepo layout is two tiers: `add button` lands in
  the package, the composed block that uses it lands in the app. GOV.UK draws the same line between
  components and patterns, and publishes patterns as guidance rather than as a shipped module.
- **"Recipe" is not a folder.** In Panda CSS and Chakra, where the term comes from, a recipe is a style
  API registered in the theme — which, in a shadcn codebase, is the `cva` call already in the component.
- **Two consumers is below any threshold for sharing.** The second consumer does not want these: Derby
  Sync has its own look — indigo on navy, rounded, dark only — and does not import `tokens.css`. A
  composition built on the dashboard's tokens would render there unstyled, silently, with no build error.
  Shared too early, each one accretes props for two apps that must both rebuild against it.

## Consequences

- Anything promoted into `packages/ui` has to be neutral and use only tokens Derby Sync defines;
  `packages/ui/README.md` says how to check.
- The shared icon map names icons after what they depict (`Trophy`, `Gavel`); the dashboard's
  `icons.ts` adds the domain names on top (`Leaderboard`, `Auction`).
- Revisit if Derby Sync adopts the design system. Then two apps want the same compositions, and the
  package is the right home.
