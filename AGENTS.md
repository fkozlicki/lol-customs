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
- `apps/app`: Next.js dashboard (next-international with `en` and `pl`, tRPC, Supabase auth).
- `packages/api`: tRPC routers consumed by `apps/app`.
- `packages/supabase`: Supabase clients and generated DB types.
- `packages/ui`: shared shadcn components (`@v1/ui/*`).
- `packages/logger`, `tooling/typescript`: logger and shared tsconfig.

## Commands

Bun workspaces with Turborepo. Run from the repo root:

```sh
bun dev:app          # dashboard on :3000
bun dev:lcu          # desktop app (Next on :3001 + Electron)
bun dev:storybook    # design system + app components on :6006
bun lint             # biome via turbo, plus sherif for workspace hygiene
bun typecheck
bun format
bun db:reset         # rebuild the local Supabase DB from migrations
bun generate:types   # regenerate packages/supabase/src/types/db.ts from the local DB
bun run --cwd apps/app generate:game-data   # refresh the champion list after a champion release
bun run --cwd apps/app test:stories   # renders every story; needs build-storybook first, not run in CI
bun run --cwd apps/api test:db   # pgTAP tests in apps/api/supabase/tests
```

CI runs `bun run lint`, `bun run typecheck` and `bun run test`. Stories are not rendered in CI; run
`test:stories` locally after touching a story or anything a story renders. `bun lint` also runs the design check in
`apps/app/scripts/check-design.ts`, which fails on colours written outside the tokens (see
[DESIGN.md](DESIGN.md)). `bun run test` runs the `bun:test` suites in `packages/domain` and `apps/app` — pure logic only, no
component tests; components are covered by their stories.

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
  `apps/app/src/locales/en.ts` and `pl.ts`.
- Some code still uses names from before the glossary: Riot-derived `game_*` columns describe a
  **Match**. Riot's `season_id` is not the ladder season.
- Imports: `@v1/*` across packages, `@/` inside `apps/app`. Never use relative paths between packages.
- Pages prefetch tRPC queries on the server and hydrate with `<HydrateClient>`. Client components use
  `useSuspenseQuery` inside a Suspense boundary with a skeleton.
- Season-scoped pages read `?season=` through `getSeasonScope` and pass the season to their queries.
- Commits follow Conventional Commits with a scope: `feat(app): ...`, `fix(db): ...`,
  `docs: ...`.
