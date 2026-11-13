# Review of `packages/api` and a plan to tidy it

Date: 2026-11-13. Status: proposal, not yet decided. Read with
[api-layer-supabase-trpc.md](api-layer-supabase-trpc.md), which holds the primary-source findings these
recommendations rest on; "research §n" below points to its sections.

Scope: the whole of `packages/api` (2,191 lines: `trpc.ts`, `logger.ts`, `root.ts`, `season.ts`,
`auction-contract.ts` and seven routers), its setup in `apps/app/src/trpc` and the tRPC route, and
`packages/supabase`. All 37 procedures are used by the app, so nothing is dead; the problems are in how
they are written.

## Verdict

The routers work, but each one is its own data-access layer, error policy and type factory. Query
building, row mapping, business rules and user-facing messages sit together in procedures. The same
error-handling block is copied 28 times. Types the generator already produces are written again by
hand, and in `auctions.ts` the generated types are cast away altogether. Several procedures make two
or three round trips, or fetch whole tables, to compute in JavaScript what one SQL statement would
return. None of this needs a new library. The pieces to fix it are already in the installed versions:
`QueryData`, `overrideTypes`, typed `.rpc()`, `getClaims()` and tRPC base procedures. The only new
dependency is `type-fest`, for `MergeDeep`.

## Findings

### 1. Request context and procedures (`trpc.ts`, `logger.ts`, the tRPC route)

- **Two auth calls on every request, one of them untrusted.**
  - `createTRPCContext` calls `supabase.auth.getUser()` (a network round trip to Supabase Auth) and
    then `getSession()` for every tRPC batch, public ones included (`trpc.ts:37-43`).
  - Supabase says not to trust `getSession()` on the server (research §"What this means": Context).
  - `protectedProcedure` checks both `ctx.user` and `ctx.session.user`, which carry the same user.
  - Every page render and every client batch therefore waits on Auth, and adds to Auth logs.
- **Template leftovers.**
  - `timingMiddleware` adds a random 100–500 ms delay in development (`trpc.ts:103-107`), which skews
    any local measurement.
  - It also `console.log`s every call in production (`trpc.ts:112`).
  - The long create-t3-app comments describe a `/src/server/api/routers` layout this repo does not
    have.
  - The tRPC route sets `Access-Control-Allow-Origin: *` and `Allow-Headers: *`. The app calls the
    route only from its own origin.
- **Logging is uneven.**
  - The pino logger plugin is attached to `publicProcedure` only. `protectedProcedure`, which runs
    every mutation, has the timing middleware and no logger.
  - At debug level the plugin logs whole responses.
- **Mixed Zod entry points.** `trpc.ts` imports `zod/v4` and the routers import `zod`. Both work in zod
  4.2.1 (research §3), but they are two names for one library.
- **Packaging.** `@v1/api` points its `types` condition at `./dist/index.d.ts`, which is never built.
  TypeScript falls back to `src` silently. `@v1/supabase` exports `./queries` and `./mutations`, which
  have no files.

### 2. Errors

- **28 copies** of
  `if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message })`.
  The database's own message (table, column and constraint names) is sent to the browser.
- **Raw rethrows.** `players.all` and `players.getByRiotId` rethrow the `PostgrestError` as it is. tRPC
  turns a non-`TRPCError` into a 500 and sends its message to the client even in production
  (research §3).
- **"Not found" by `.single()` plus `PGRST116`.** It is used in five procedures. PGRST116 means zero
  *or several* rows, so a duplicate is reported as "not found" (research §3). `.maybeSingle()` keeps
  the two apart.
- **Auction errors.**
  - `domainError` (`auctions.ts:55-100`) recovers a code by regex from the message text, then picks the
    HTTP code by substring (`includes("NOT_ALLOWED")`, `includes("TAKEN")` …).
  - Its 14 user-facing messages are hard-coded in English in the API. CLAUDE.md says every
    user-facing string goes into the `en`/`pl` dictionaries, so Polish users see English toasts.
  - PostgREST lets a `RAISE` choose a stable code and HTTP status (`ERRCODE = 'PTxxx'`, or a code in
    `HINT`), so the API can map on a code instead of text (research §3).

### 3. Types written by hand

- **`LeaderboardAtRow`** (`rift-rank.ts:13-32`) and **`HallOfFameEntry`** restate what
  `Database["public"]["Functions"][...]["Returns"]` already says.
- **`auctions.ts` erases the generated types.**
  - `callRpc` casts `supabase.rpc` to `(name: string, args?: Record<string, unknown>) => …` and
    returns `data as T`.
  - So none of the 13 auction RPCs has its name, arguments or result checked.
  - `ProfileClient` and `PoolClient` are hand-written structural copies of the Supabase client, used
    the same way.
  - `RawCaptain`, `RawPlayer`, `RawEvent`, `RawRoom` and `RawListItem` describe the JSON that SQL
    builds in `_auction_snapshot`, which returns `jsonb`, so it is typed `Json` today.
- **Two auction contract files.** `packages/api/src/auction-contract.ts` (129 lines) and
  `apps/app/src/components/auctions/auction-contract.ts` (35 lines, partly derived from
  `RouterOutputs`) define overlapping unions such as `AuctionStatus` and `AuctionPhase`. They already
  disagree: the app's `AuctionPhase` includes `null`.
- **Fighting inference.**
  - `mostPlayedChampions` checks `Array.isArray(row.match)` and casts the embed twice, for an embed
    postgrest-js types exactly (research §1).
  - The forum routers guard `Array.isArray(post.reactions)` on to-many embeds that are always arrays.
  - Forum `content` goes in and out as `Json` with `as Json` casts.
  - `profileStats` patches `matches_played ?? 0` and `qualified ?? false`, because generated columns
    are typed nullable.
- **The fix the docs give** is one `MergeDeep` layer over the generated `Database`, for `jsonb`
  columns, `jsonb` function returns and `RETURNS TABLE` columns the generator types wrongly. Add
  `QueryData<typeof query>` wherever a result type is needed (research §1). The hand-written types then
  live in one file, beside the schema they describe.

### 4. Queries

| Procedure | Today | Cost | Better |
|---|---|---|---|
| `players.mostPlayedChampions` | every participant row of the player, each with its match and both `teams`, aggregated in JS | grows with the player's history; `win` is already on `match_participants` | one SQL aggregate (`group by champion_id`), as a function or view |
| `players.seasonSummaries` | the player's whole `rating_history`, keeping the newest row per season in JS | grows with history | `ratings` already holds the final state per track: one select, `ladder_season_id > 0` |
| `players.profileStats` | `ratings` select, then `standings_position` RPC, sequentially | two round trips in series | `Promise.all`, or position computed in the same function |
| `players.relations`, `riftRank.hallOfFame` | RPC, then a second query for player names | two round trips | the SQL function returns the names (join `players`) |
| `riftRank.leaderboard` after N games | first query: the Nth match; second: its snapshot time; third: `leaderboard_at` | three round trips in series | one function taking `p_after_games` |
| `forum.posts.list`, `.get`, `comments.list` | every reaction row and comment id per post, counted in JS (logic copied three times) | grows with activity | embedded aggregates, e.g. `comments:forum_comments(count)` and reaction counts in one view or function |
| `auctions.create` / `updateLobby` (`poolPayload`) | **all** players and **all** latest ranks, to rank the 8 of a pool | whole tables per call | look up the 8 Riot IDs in SQL |
| `players.getByRiotId` | `ilike` on name and tag with user input | `%`/`_` act as wildcards, and with several matches `.single()` fails | compare a normalized key (as `riotIdKey` does) in SQL |

`count: "exact", head: true` in `ladderRatedMatchCount` is fine at this size (research §4). Its
`isFinite` and `min(n, 100_000)` guards defend against values PostgREST cannot return.

### 5. Structure

- **Routers do four jobs at once:** build queries, map rows into shapes for the UI, apply business
  rules, and phrase errors for users. Two examples:
  - `normalizeRoom` (`auctions.ts:245-317`) computes every auction permission (`canBid`, `canConcede`,
    …) in TypeScript, while SQL enforces the same rules again.
  - `seasons.list` works out the current season in JS, with a `NaN` guard for a `starts_at` that has
    been `NOT NULL` since the seasons migration. SQL has `ladder_season_for`.
- **Names.** `riftRank` predates the glossary. It serves the season standings and Hall of Fame.
  `season.ts` only re-exports `@v1/domain/season` plus one schema.
- **No layer below the routers.** tRPC's own guidance is to put shared logic in plain functions, not in
  callers. Next.js recommends a server-only data-access layer returning minimal DTOs (research §2).
  Today nothing can be reused without going through a procedure.

## Target shape

```
packages/supabase                 one typed client and the schema's types
  src/types/db.ts                 generated, untouched
  src/types/index.ts              Database = MergeDeep<Generated, overrides>; Client; Tables<…>
  src/queries/<area>.ts           (client, args) => DTO, one module per area: standings, players,
                                  matches, forum, auctions. No tRPC, no React, `server-only`.
packages/api                      thin routers
  src/trpc.ts                     context (one auth check), base procedures, one error mapper
  src/router/<area>.ts            input schema → query function → return
apps/api/supabase/migrations      read models that belong in SQL: aggregates, joins, stable error codes
```

- **Query functions take the per-request client.** RLS keeps running as the user, and the server
  client cannot be a module singleton, because it carries the request's cookies (research §2).
- **One error mapper:**
  - `PostgrestError` becomes a `TRPCError` with the original as `cause`, and a safe message;
  - "no row" becomes `null` via `.maybeSingle()`, where absence is normal;
  - 23505 becomes `CONFLICT`, 23503/23514/22P02 `BAD_REQUEST`, 42501 `FORBIDDEN`;
  - a `PTxxx` code keeps its status;
  - auction domain codes reach the client as a code that the app's dictionary translates.
- **Context checks auth once.** `getUser()` alone, or `getClaims()`, which verifies the JWT locally if
  the project uses asymmetric signing keys (a Supabase dashboard setting, not a package version). Drop
  `getSession()`, and attach the logger to every base procedure.
- **Output validation only where trust is missing.** Database `jsonb` read back by the client is the
  case: the auction snapshot. tRPC calls output validators optional and they cost a parse per
  response, so `MergeDeep` types are enough elsewhere (research §3).

## Package upgrades

- **Needed:** `type-fest` (new; current 4.x), for `MergeDeep`. The copies already in `node_modules` are
  0.x transitive ones that predate it.
- **Not needed for this work:** everything else used here (`QueryData`, `overrideTypes`, typed `.rpc()`,
  `.maybeSingle()`, `getClaims()`, tRPC base procedures) is in the installed supabase-js 2.89 and
  tRPC 11.8.1.
- **Optional:**
  - Supabase CLI 3.x is available; it was not evaluated here and nothing above depends on it.
  - Local type generation omits the PostgREST version key, which leaves two typings
    (`maxAffected`, spreads over to-many embeds) off. They can be turned on through the same
    `MergeDeep` layer (research §1, untested).

## Order of work

Each step is one pull request that leaves the app working. The steps are ordered by value against risk.

1. **Context, errors and leftovers.**
   - One auth check per request.
   - One error mapper used by every router; no database text reaches the client.
   - `.maybeSingle()` for "not found".
   - Remove the dev delay, the production `console.log` and the open CORS headers.
   - Attach the logger to every procedure.
   - Pick one Zod import.
   - Fix the `exports` that point at nothing.
2. **Typed database layer.**
   - Add `type-fest` and the `MergeDeep` overrides: auction snapshot and list, forum `content`, rank
     snapshot, and the generated columns `matches_played`/`qualified`.
   - Delete `callRpc`, `ProfileClient`, `PoolClient`, `LeaderboardAtRow` and the `Raw*` types in favour
     of typed `.rpc()` and inference.
   - Merge the two auction contract files into one source.
3. **Query modules.** Move each router's queries into `packages/supabase/src/queries/<area>.ts` (or a
   new `packages/db`; see the open questions), returning DTOs. Routers shrink to input, call, return.
4. **Read models in SQL**, with pgTAP for each:
   - most played champions;
   - season summaries from `ratings`;
   - names returned by `player_relations` and `hall_of_fame`;
   - the "after N games" leaderboard in one call;
   - forum counts;
   - the pool lookup for auctions;
   - a Riot ID lookup that does not use `ilike`.
5. **Auctions.**
   - SQL raises stable codes.
   - The API maps codes, not text.
   - Messages move to the `en`/`pl` dictionaries.
   - Permissions come from one place: the snapshot or `@v1/domain`, not recomputed in the router.
6. **Names.** Rename `riftRank` to the glossary's terms, `standings` and `hallOfFame`. This touches
   the app's calls, so it goes last.

Tests follow the repo's rules. SQL read models get pgTAP. Pure mapping goes into `@v1/domain` or the
app's mappers, with `bun:test`. Query modules are thin enough to be covered by the routes that use them.

## Open questions for the owner

1. **Where the query layer lives.** Either `packages/supabase/src/queries` (the exports already exist,
   and it sits beside the client and types) or a new `packages/db` (clearer name, one more package).
   Nothing in the sources prescribes either (research §2).
2. **Auth in the context.** Should the project switch Supabase Auth to asymmetric JWT signing keys, so
   that `getClaims()` checks sessions without a network call? Or is one `getUser()` per request
   enough?
3. **Output validation.** Use Zod on the auction snapshot only, or rely on `MergeDeep` types
   everywhere?
4. **Scope and order.** Steps 1–2 are mechanical and low risk. Steps 4–5 change SQL and behaviour, and
   would each go through the same review and test routine as the database work.
