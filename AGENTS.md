# Derby

An Elo ladder for a group's League of Legends custom games. A desktop app uploads matches from the League
client, Supabase rates them, and a Next.js app shows leaderboards, match history, Hall of Fame and more.
See [README.md](README.md) for setup.

## Read first

- [CONTEXT.md](CONTEXT.md): the domain glossary. Use its terms in code, docs and conversation.
- [docs/adr/](docs/adr/): accepted decisions. Don't re-litigate them without saying so.
- [docs/formulas.md](docs/formulas.md): rating and OP score formulas. Keep
  [docs/formulas-pl.md](docs/formulas-pl.md) in sync when changing either.
- [DESIGN.md](DESIGN.md): how `apps/app` looks and why. Read it before building a page there.
- [.cursorrules](.cursorrules): detailed code conventions for the app, tRPC, forms and UI.

## Layout

- `apps/lcu`: **Derby Sync**, the Electron app (still built and shown as "Niunio") that reads custom games from the League client and writes them
  straight into Supabase tables. Distributed as an installer to non-technical users.
- `apps/api`: the Supabase project: migrations, pgTAP tests, config. Not the tRPC server.
- `apps/app`: Next.js dashboard (next-intl with `en` and `pl`, tRPC, Supabase auth): pages,
  containers and mappers. Everything visual comes from `packages/ui`.
- `apps/storybook`: the one Storybook, with every story in `stories/`. It renders `packages/ui`,
  through its exports, and nothing else.
- `packages/api`: tRPC routers consumed by `apps/app`.
- `packages/supabase`: Supabase clients and generated DB types.
- `packages/ui`: Derby's design system (`@v1/ui/*`): shadcn primitives in `src/components`, and the
  recipes built on them in `src/recipes` — Derby's visual components, with their own dictionary.
  See [its README](packages/ui/README.md) and ADR 0004.
- `packages/game-assets`: what Derby knows about game assets — the generated champion list, every asset
  URL, which patch to draw from (`latestPatch`). Plain TypeScript, used by the app, the design system and
  Derby Sync (ADR 0006).
- `packages/logger`, `tooling/typescript`: logger and shared tsconfig.

## Commands

Bun workspaces with Turborepo. Run from the repo root:

```sh
bun dev:app          # dashboard on :3000
bun dev:lcu          # desktop app (Next on :3001 + Electron)
bun dev:storybook    # the design system, primitives and recipes, on :6006
bun lint             # biome via turbo, plus sherif for workspace hygiene
bun typecheck
bun format
bun db:reset         # rebuild the local Supabase DB from migrations
bun generate:types   # regenerate packages/supabase/src/types/db.ts from the local DB
bun generate:game-data   # refresh the champion list and self-hosted icons after a champion release
bun run --cwd apps/storybook test:stories   # every story as a test: render, play, axe; each locale × theme (Vitest + Chromium)
bun run --cwd apps/storybook test:stories:coverage   # the same, with how much of packages/ui the stories exercise
bun run --cwd apps/storybook chromatic   # publish to Chromatic by hand (CHROMATIC_PROJECT_TOKEN in the environment); CI does it on push
bun run --cwd apps/api test:db   # pgTAP tests in apps/api/supabase/tests
```

CI runs `bun run lint`, `bun run typecheck`, `bun run test` and the story tests; Chromatic publishes the
Storybook and diffs it visually once `CHROMATIC_PROJECT_TOKEN` is set. The first story test run needs
`bunx playwright install chromium` in `apps/storybook`. `bun lint` also runs the design check in
`apps/app/scripts/check-design.ts`, which fails on colours written outside the tokens (see
[DESIGN.md](DESIGN.md)). `bun run test` runs the `bun:test` suites in `packages/domain`, `packages/game-assets`, `packages/ui`, `apps/app` and `apps/lcu` — pure
logic only, no component tests: recipes are covered by their stories, and the mappers that feed them
by tests in the app.

## Constraints

- **Installed LCU clients write to the database directly.** They upsert into `matches`, `players`,
  `teams` and `match_participants` using the current column names. Renaming, repurposing or tightening
  those columns breaks clients already out there. Add new columns and derive values with triggers instead
  (see ADR 0001).
- **Match eligibility is decided in the LCU client only** (custom game, ten players, at least five
  minutes). The database accepts what it receives.
- **Schema changes are new migrations** in `apps/api/supabase/migrations/` with a timestamp prefix. Never
  edit an applied migration. After a migration, run `bun generate:types` and commit the updated types.
- **Seasons are created by a migration** that inserts a season row. There is no admin UI.
- Rating logic lives in SQL functions. A change there usually needs a pgTAP test and a note in
  `docs/formulas.md`.

## Conventions

- Code, comments, commit messages and docs are in English. Every user-facing string goes into both
  `en.ts` and `pl.ts`: a string a recipe renders into `packages/ui/src/recipes/messages/`, any other into
  `apps/app/src/locales/`. The app spreads both into one next-intl dictionary, so a new top-level key
  cannot reuse a name from the other side (ADR 0005); everything reads it through `useTranslations` or
  `getTranslations`.
- Some code still uses names from before the glossary: Riot-derived `game_*` columns describe a
  **Match**. Riot's `season_id` is not the ladder season.
- Imports: `@v1/*` across packages, `@/` inside `apps/app`. Never use relative paths between packages.
- A recipe takes plain props: no tRPC types, no `@v1/domain`, no query string, no router. The app
  keeps the container (queries, URL state, routing) and one mapper per data root (`toMatchCardView`,
  `toStandingsRowView`, …) that formats with `@v1/domain` and builds the links. Biome enforces the
  imports (ADR 0004).
- One component per file, in the app, the recipes and Derby Sync alike; a helper component gets a file
  beside the one that uses it. A file that grows past a few hundred lines is a sign it holds more than
  one job. shadcn's primitives in `packages/ui/src/components` are the exception and stay as generated.
- Pages prefetch tRPC queries on the server and hydrate with `<HydrateClient>`. Client components use
  `useSuspenseQuery` inside a Suspense boundary with a skeleton.
- Season-scoped pages read `?season=` through `getSeasonScope` and pass the season to their queries.
- Commits follow Conventional Commits with a scope: `feat(app): ...`, `fix(db): ...`,
  `docs: ...`.
