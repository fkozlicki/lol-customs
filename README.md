# Custom Ladder

An Elo ladder for a group's League of Legends custom games.

Players install a small desktop app that reads custom games from their League client and uploads them.
Each match is rated and gets per-player OP scores. The web app then shows leaderboards, match history,
Hall of Fame and rivalries, per season and across all seasons. It also has a team shuffler, live
auctions for picking teams, and a forum.

Domain terms are defined in [CONTEXT.md](CONTEXT.md), decisions are recorded in [docs/adr/](docs/adr/),
and the rating and OP score formulas are in [docs/formulas.md](docs/formulas.md)
([Polish version](docs/formulas-pl.md)).

## How it fits together

```
League client ──► apps/lcu (Electron) ──► Supabase (apps/api) ◄── packages/api (tRPC) ◄── apps/app (Next.js)
                  filters custom games     stores matches,        queries per season       leaderboard, matches,
                  and uploads them         rates them in SQL                               Hall of Fame, auctions
```

| Path | What it is |
| --- | --- |
| `apps/lcu` | Electron desktop app that syncs custom games from the League client ([details](apps/lcu/README.md)) |
| `apps/api` | Supabase project: migrations, rating and OP score functions, pgTAP tests |
| `apps/app` | Next.js dashboard, in English and Polish |
| `packages/api` | tRPC routers used by the dashboard |
| `packages/supabase` | Supabase clients and generated database types |
| `packages/ui` | Shared shadcn/ui components |
| `packages/logger` | Pino logger |
| `tooling/typescript` | Shared TypeScript config |

Stack: Bun, Turborepo, Next.js, tRPC, Supabase (Postgres, Auth, Storage), Tailwind, shadcn/ui, Electron,
Biome.

## Getting started

Prerequisites: [Bun](https://bun.sh), Docker (for the local Supabase stack) and a
[Riot API key](https://developer.riotgames.com).

```sh
bun install

cp apps/api/.env.example apps/api/.env
cp apps/app/.env.example apps/app/.env
cp apps/lcu/.env.example apps/lcu/.env

bun run --cwd apps/api dev   # start local Supabase; prints the URL, anon key and service key
bun db:reset                 # apply all migrations
bun dev:app                  # dashboard on http://localhost:3000
```

Put the keys printed by Supabase, your Riot API key and a Hugging Face token (`HUGGING_FACE_TOKEN`, used to check
forum image uploads) into `apps/app/.env`. To sync matches from your own
League client against the local database, point `apps/lcu/.env` at the local Supabase and run
`bun dev:lcu`.

## Commands

| Command | Does |
| --- | --- |
| `bun dev` | Start everything in parallel |
| `bun dev:app` / `bun dev:lcu` | Start the dashboard / desktop app |
| `bun lint` | Biome lint plus workspace checks (sherif) |
| `bun typecheck` | TypeScript across all workspaces |
| `bun format` | Format with Biome |
| `bun db:reset` | Rebuild the local database from migrations |
| `bun generate:types` | Regenerate database types from the local database |
| `bun run --cwd apps/api test:db` | Run the pgTAP database tests |
| `bun run --cwd apps/api push` | Push migrations to the linked Supabase project |

CI runs `lint` and `typecheck` on every push.

## Working on the database

- Schema changes go into a new timestamped migration in `apps/api/supabase/migrations/`. After adding
  one, run `bun db:reset`, then `bun generate:types`, and commit the updated types.
- Desktop apps already installed by players write straight into `matches`, `players`, `teams` and
  `match_participants`. Don't rename or repurpose those columns: add new ones instead.
- A new season is started by a migration that inserts a season row
  ([ADR 0001](docs/adr/0001-seasons-dual-rating-track.md)).

## Releasing the desktop app

See [apps/lcu/README.md](apps/lcu/README.md). In short: `cd apps/lcu && bun run release` builds a
Windows installer with the Supabase config embedded, and `LCU_MINIMUM_VERSION` in the dashboard prompts
older clients to update.

## License

[MIT](LICENSE.md)
