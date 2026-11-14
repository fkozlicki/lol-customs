# Organising a tRPC-over-Supabase API layer

Date: 2026-11-13. Status: research input. Versions checked: @trpc/server, @trpc/client and
@trpc/tanstack-react-query 11.8.1; @tanstack/react-query 5.90.12; @supabase/supabase-js and
@supabase/postgrest-js 2.89.0; @supabase/ssr 0.8.0; Supabase CLI 2.67.3 (which pins postgres-meta
v0.95.1 and PostgREST v14.1 locally); zod 4.2.1; next 16.1.0; Postgres 17. Source was read at those tags,
and in `node_modules/.bun` where the installed copy ships `src/`.

## Question

`packages/api` holds tRPC routers that call Supabase JS directly, with some hand-written types and
constants. How should that layer be organised so it stays clean, typed and easy to maintain? Is a
separate `packages/db` of reusable queries worth having? Can Supabase type `jsonb` columns and the
returns of SQL functions called through `.rpc()`? This note collects what the primary sources say. It
does not review the current code; that is a separate job.

## Findings

### 1. Typing Supabase data

**What `supabase gen types typescript` emits.** The CLI runs the postgres-meta image it pins
(`supabase/postgres-meta:v0.95.1` in CLI 2.67.3,
[Dockerfile](https://github.com/supabase/cli/blob/v2.67.3/pkg/config/templates/Dockerfile)), and its
template ([typescript.ts](https://github.com/supabase/postgres-meta/blob/v0.95.1/src/server/templates/typescript.ts))
decides every type:
- **Tables**: `Row`, `Insert` and `Update` per table, plus `Relationships` (the FKs postgrest-js uses to
  type embeds). In `Insert`, a column is optional when it is nullable, an identity or has a default;
  `GENERATED ALWAYS` identities are `?: never`. In `Update`, every column is optional.
- **Column nullability** comes from `NOT (attnotnull OR (domain AND typnotnull))`
  ([columns.sql.ts](https://github.com/supabase/postgres-meta/blob/v0.95.1/src/lib/sql/columns.sql.ts)).
  Postgres never sets `attnotnull` on a view's columns, so **every view column is typed `T | null`**. A
  column whose type is a `NOT NULL` domain counts as non-null, and domain columns are typed by their
  base type.
- **Views**: `Row` and `Relationships`. `Insert` and `Update` appear only for updatable views, and
  every column in them is nullable and optional.
- **Functions** (`getFunctionReturnType` in the template):
  - `RETURNS TABLE (...)` becomes an object of the output columns, **all typed non-null**. The template
    never adds `| null` here, whatever the SQL can actually produce (a LEFT JOIN, an aggregate over no
    rows).
  - `RETURNS <table or view>` / `RETURNS SETOF <table or view>` reuse that relation's column
    nullability, and add `SetofOptions { from, to, isOneToOne, isSetofReturn }`. With that, `.rpc()` can
    be followed by `.select('col, embed(...)')`, typed against the target table.
  - Base, enum and composite returns are mapped by `pgTypeToTsType`, **without `| null`**. So a scalar
    function that can return NULL is typed as never doing so.
  - `json`/`jsonb` → `Json`; `void` → `undefined`; `record` → `Record<string, unknown>`; range types and
    anything unknown → `unknown`.
  - The `[]` suffix is added only when the function is set-returning **and** `prorows > 1`. Postgres's
    default `ROWS` estimate for a set-returning function is 1000
    ([CREATE FUNCTION](https://www.postgresql.org/docs/17/sql-createfunction.html)), so `SETOF` is an
    array unless it is declared `ROWS 1`.
  - Arguments with a default become optional (`p_limit?: number`); no arguments gives `Args: never`.
    Overloads PostgREST cannot resolve are emitted as `Returns: { error: true } & "<message>"`.
- **Enums** become string-literal unions, under `Enums` and wherever they are used.
- **Composite types**: every attribute is typed `T | null`.
- A **`__InternalSupabase: { PostgrestVersion }`** key is emitted only when pg-meta is given
  `PG_META_POSTGREST_VERSION`. CLI 2.67.3 does not pass it when generating from the local DB
  ([types.go](https://github.com/supabase/cli/blob/v2.67.3/internal/gen/types/types.go)), and it has no
  flag to set it. Without the key, supabase-js falls back to `{ PostgrestVersion: '12' }`
  ([SupabaseClient.ts](https://github.com/supabase/supabase-js/blob/v2.89.0/packages/core/supabase-js/src/SupabaseClient.ts)).
  That switches off the typing for features that need PostgREST 13 or later: `maxAffected` and spreads
  over to-many embeds ([feature-flags.ts](https://github.com/supabase/supabase-js/blob/v2.89.0/packages/core/postgrest-js/src/types/feature-flags.ts)).
- The same template emits the helper types `Tables<>`, `TablesInsert<>`, `TablesUpdate<>`, `Enums<>`
  and `CompositeTypes<>`, along with `DatabaseWithoutInternals`. The Supabase docs present `Tables<'x'>`
  as the shorthand for `Database['public']['Tables']['x']['Row']`
  ([generating types](https://supabase.com/docs/guides/api/rest/generating-types),
  [TypeScript support](https://supabase.com/docs/reference/javascript/typescript-support)).

**Typing `jsonb` and fixing generated types: the official route is `MergeDeep`.**
- The Supabase docs: generate the types into one file, then export
  `Database = MergeDeep<DatabaseGenerated, { public: { Tables: { t: { Row: { data: MyJson | null } } } } }>`,
  using type-fest's `MergeDeep` ([generating types](https://supabase.com/docs/guides/api/rest/generating-types)).
  This needs supabase-js 2.48.0 or later and `strictNullChecks: true`. The same page uses it to make view
  columns non-null.
- Once the column is typed this way, JSON-path selects infer through it. `payload->phase` gets the
  merged type. `->>` gives the merged type only if that is a string (or a union of strings), and
  `string` otherwise ([result.ts](https://github.com/supabase/supabase-js/blob/v2.89.0/packages/core/postgrest-js/src/select-query-parser/result.ts),
  `ResolveJsonPathType`; `JsonPathToType` in
  [utils.ts](https://github.com/supabase/supabase-js/blob/v2.89.0/packages/core/postgrest-js/src/select-query-parser/utils.ts)).
  Without a merged type, a JSON path is typed `Json`.
- The docs show `MergeDeep` on `Tables` and `Views` only. **Checked here, not in the docs:** merging
  `Functions.<fn>.Returns` works the same way. A scratch typecheck against supabase-js 2.89.0 and
  type-fest 4.41 typed `.rpc('snapshot')` with a custom shape for a `RETURNS jsonb` function, and made a
  `RETURNS TABLE` column `number | null`. In the same check, `->>` on a numeric JSON field came back as
  `string`. `type-fest` is not a dependency in this repo today; only 0.x copies are installed, pulled in
  by other packages, and those predate `MergeDeep`.
- These overrides are types only: nothing checks the data at runtime. Runtime validation means a schema
  (zod) at the boundary; see topic 3.

**Helpers for query results** ([lib/types.ts](https://github.com/supabase/supabase-js/blob/v2.89.0/packages/core/supabase-js/src/lib/types.ts)):
- `QueryResult<T>` is the awaited type of a builder.
- `QueryData<T>` is its `data` with `null` excluded.
- `QueryError` is `PostgrestError`.

The docs' pattern is `const q = supabase.from(...).select('...'); type X = QueryData<typeof q>`. That
gives the nested type of a join without writing it by hand
([joins and nesting](https://supabase.com/docs/guides/database/joins-and-nesting)).

**How postgrest-js infers from a `select()` string** (2.89.0,
[result.ts](https://github.com/supabase/supabase-js/blob/v2.89.0/packages/core/postgrest-js/src/select-query-parser/result.ts)):
- The string is parsed at the type level. `alias:col` renames, and `col::type` casts.
- Aggregates such as `id.sum()` rename the field to the aggregate's name.
- **Many-to-one embeds** (forward FK) are `T | null` unless marked `!inner`, which makes them `T`.
- **One-to-many embeds** are `T[]`.
- A reverse relation through a non-null FK is `T`.
- Ambiguous FKs need `table!fk_name(...)`; PostgREST rejects them with PGRST201.
- `...embed(...)` spreads a to-one embed's columns into the parent. Spreading a to-many embed needs
  PostgREST 13 or later in the type flags.
- Mistakes surface as `SelectQueryError<'...'>` in the result type rather than as compile errors at the
  call site.

**`.returns<T>()` and `.overrideTypes<T>()`.**
- In 2.89.0, `returns<T>()` is
  `@deprecated Use overrideTypes<yourType, { merge: false }>() method at the end of your call chain instead`
  ([PostgrestBuilder.ts](https://github.com/supabase/supabase-js/blob/v2.89.0/packages/core/postgrest-js/src/PostgrestBuilder.ts),
  [PostgrestTransformBuilder.ts](https://github.com/supabase/supabase-js/blob/v2.89.0/packages/core/postgrest-js/src/PostgrestTransformBuilder.ts)).
  It is an unchecked cast. In the scratch check, `.select('id').returns<{ id: number }[]>()` compiled
  over a `string` column.
- `overrideTypes<T>()` merges `T` into the inferred type by default. `{ merge: false }` replaces it. It
  also works after `.single()` and `.maybeSingle()`
  ([generating types](https://supabase.com/docs/guides/api/rest/generating-types)).
- The `.rpc()` JSDoc uses `overrideTypes` for cross-schema functions, where inference fails
  ([PostgrestClient.ts](https://github.com/supabase/supabase-js/blob/v2.89.0/packages/core/postgrest-js/src/PostgrestClient.ts)).
- Also deprecated in 2.89.0: the `foreignTable` option, in favour of `referencedTable`.

**`.rpc()` typing.**
- The signature is `rpc(fn, args, { head, get, count })`. `fn` is limited to `keyof Functions` and
  `args` is checked against `Args`.
- `get: true` calls the function over GET, which PostgREST runs read-only.
- `count` applies only to set-returning functions
  ([PostgrestClient.ts](https://github.com/supabase/supabase-js/blob/v2.89.0/packages/core/postgrest-js/src/PostgrestClient.ts)).
- The result type comes from `Returns`, and from `SetofOptions` when present
  ([rpc.ts](https://github.com/supabase/supabase-js/blob/v2.89.0/packages/core/postgrest-js/src/types/common/rpc.ts)).
  So a function declared `RETURNS SETOF some_table` can be filtered, selected and embedded with types;
  a `RETURNS TABLE (...)` function is filterable at runtime, but has no `Relationships` to embed through.

### 2. Where queries live

- **Supabase**: none of its docs read for this note give guidance on a repository or query-module
  layer for supabase-js. The guides call `supabase.from()` / `.rpc()` at the point of use, and offer
  `QueryData` so a query defined in one place can export its result type
  ([joins and nesting](https://supabase.com/docs/guides/database/joins-and-nesting)). On the server, the
  client is created per request because it carries that request's cookies. The docs call creating one
  "lightweight" ([Next.js server-side auth](https://supabase.com/docs/guides/auth/server-side/nextjs)).
  A query module therefore takes the client as a parameter; it cannot hold one at module scope.
- **tRPC**:
  - Split routers by feature and nest them in one app router. `t.mergeRouters` flattens them instead,
    and throws on duplicate paths. `lazy()` loads a router on demand to cut cold starts
    ([merging routers](https://trpc.io/docs/server/merging-routers)).
  - "Base procedures" (`publicProcedure`, `authedProcedure`, `organizationProcedure`, built by stacking
    `.use()` and `.input()`) are "a key pattern for code and behaviour re-use"
    ([procedures](https://trpc.io/docs/server/procedures)).
  - `inferProcedureBuilderResolverOptions<typeof proc>` types a standalone helper that takes a
    procedure's `{ ctx, input }` (same page).
  - Server-side callers: "`createCaller` should not be used to call procedures from within other
    procedures". tRPC says to "extract the shared logic into a separate function and call that from
    within the procedures" ([server-side calls](https://trpc.io/docs/server/server-side-calls)). This is
    the closest first-party statement in favour of a query/function layer under the routers.
    `router.createCaller` is not deprecated in 11.8.1; `createCallerFactory` is the documented form.
  - Context: put request-independent dependencies in `createContextInner` and request-scoped data
    (the session) in the outer `createContext`. Context is built once per HTTP request, and procedures in
    one batch share it ([context](https://trpc.io/docs/server/context)).
  - In `procedureBuilder.ts`, `unstable_concat` is deprecated in favour of `.concat()`
    ([11.8.1 source](https://github.com/trpc/trpc/blob/v11.8.1/packages/server/src/unstable-core-do-not-import/procedureBuilder.ts)).
- **tRPC with RSC** ([server components](https://trpc.io/docs/client/tanstack-react-query/server-components)):
  - The setup has three parts: `getQueryClient = cache(makeQueryClient)`, one query client per request;
    `createTRPCOptionsProxy({ ctx, router, queryClient })`; and `HydrateClient` wrapping
    `HydrationBoundary`.
  - `prefetch` is not awaited, so pending queries must dehydrate (`shouldDehydrateQuery` plus
    `status === 'pending'`), and errors must not be redacted, so that Next.js can still detect dynamic
    rendering.
  - The server file should `import 'server-only'`.
  - `caller` "is detached from your query client". Use it only for data the server alone needs.
    `await queryClient.fetchQuery(trpc.x.queryOptions())` covers data used on both sides.
  - The docs also mention `unstable_createHydrateClient`, which is **not present in 11.8.1**: the docs
    track newer releases.
- **TanStack Query** ([advanced SSR](https://tanstack.com/query/v5/docs/framework/react/guides/advanced-ssr)):
  - Pending queries can be dehydrated since 5.40.
  - Set `staleTime > 0` with SSR.
  - Don't render a query's result in a Server Component and also in a Client Component. "React Query
    has no idea of how to revalidate the Server Component", so treat Server Components as prefetch only.
  - TanStack has no guidance on a data-access layer.
  - The current page uses a `queryClient.query()` API that 5.90.12 does not have; the docs again track
    newer releases.
- **Next.js** (the stack's other first party; [data security](https://nextjs.org/docs/app/guides/data-security)):
  - For new projects it recommends a **Data Access Layer**: an internal library that runs only on the
    server (`server-only`), performs authorization checks, and returns "safe, minimal Data Transfer
    Objects".
  - It recommends choosing one data-fetching approach and not mixing them.
  - Its audit checklist asks whether "database packages and environment variables are not imported
    outside the Data Access Layer".

### 3. Validation and errors

**tRPC validators** ([validators](https://trpc.io/docs/server/validators)):
- **Input**: a failure throws `BAD_REQUEST` with the validator error as `cause`. Chained `.input()` calls
  merge object schemas, and the later key wins.
- **Output**: a failure throws `INTERNAL_SERVER_ERROR`. The client gets what the validator returns, so
  `z.object` strips unknown keys.
- tRPC calls output validation less important than input validation, "since tRPC already infers return
  types". It suggests it for untrusted data, or to limit what reaches the client.
- **Cost**: the docs give no figure. In 11.8.1, output validation is a middleware that `await`s the
  parser on every successful result, including RSC and caller calls
  ([middleware.ts](https://github.com/trpc/trpc/blob/v11.8.1/packages/server/src/unstable-core-do-not-import/middleware.ts),
  `createOutputMiddleware`). Its cost scales with the size of the payload.
- **Zod 4 in tRPC 11.8.1**: tRPC prefers a schema's `parseAsync` over Standard Schema
  ([parser.ts](https://github.com/trpc/trpc/blob/v11.8.1/packages/server/src/unstable-core-do-not-import/parser.ts)),
  so a failed Zod input leaves a real `ZodError` as `cause`. An `instanceof ZodError` check in
  `errorFormatter` therefore works.
- tRPC's formatter example still calls `error.cause.flatten()`
  ([error formatting](https://trpc.io/docs/server/error-formatting)). In zod 4.2.1, `ZodError#flatten()`
  and `#format()` are `@deprecated` in favour of `z.treeifyError()`, and `z.flattenError()` is the
  function form for flat schemas ([error formatting](https://zod.dev/error-formatting); `src/v4/classic/errors.ts`
  in the installed package).
- The `zod/v4` subpath "will continue to work forever" ([versioning](https://zod.dev/v4/versioning)).

**tRPC errors** ([error handling](https://trpc.io/docs/server/error-handling)):
- Codes and their HTTP statuses: `BAD_REQUEST` 400, `UNAUTHORIZED` 401, `FORBIDDEN` 403, `NOT_FOUND`
  404, `CONFLICT` 409, `PRECONDITION_FAILED` 412, `UNPROCESSABLE_CONTENT` 422, `TOO_MANY_REQUESTS` 429,
  `INTERNAL_SERVER_ERROR` 500, and others.
- Wrap with `new TRPCError({ code, message, cause })` to keep the original error.
- **An error that is not a `TRPCError` becomes `INTERNAL_SERVER_ERROR` and keeps its message, which is
  sent to the client even in production.** Rethrowing a `PostgrestError` as is can therefore leak table
  or constraint names.
- Use `errorFormatter` to replace messages, and `onError` to log; `onError` does not change the
  response.
- The stack trace is included only when `isDev` is true.

**PostgREST and Postgres errors.**
- postgrest-js resolves to `{ data, error }` and does not throw. `.throwOnError()` makes it throw a
  `PostgrestError` (`message`, `details`, `hint`, `code`) and narrows `data` to non-null
  ([PostgrestBuilder.ts](https://github.com/supabase/supabase-js/blob/v2.89.0/packages/core/postgrest-js/src/PostgrestBuilder.ts)).
- HTTP mapping of SQLSTATEs in PostgREST 14
  ([errors](https://docs.postgrest.org/en/v14/references/errors.html)):

  | Code | Meaning | Status |
  |---|---|---|
  | 23505 | unique violation | 409 |
  | 23503 | foreign key violation | 409 |
  | P0001 | default for `RAISE` | 400 |
  | 42501 | insufficient privilege | 401 anonymous, 403 authenticated |
  | 42883 | undefined function | 404 |
  | `40*`, `57*` | e.g. 57014 statement timeout | 500 |
  | other | e.g. 23502, 23514, 22P02 | 400 |
  | PGRST116 | singular response with 0 or >1 rows | 406 |

- A bare `RAISE EXCEPTION` uses SQLSTATE P0001
  ([PL/pgSQL errors](https://www.postgresql.org/docs/17/plpgsql-errors-and-messages.html)).
  `RAISE ... USING ERRCODE = 'PT404', DETAIL = ..., HINT = ...` sets the HTTP status (here 404) and puts
  `"code": "PT404"` in the body. `RAISE SQLSTATE 'PGRST'` with JSON in `MESSAGE` and `DETAIL` sets the
  full response ([errors](https://docs.postgrest.org/en/v14/references/errors.html)).
- **"Not found" shapes** in 2.89.0
  ([PostgrestTransformBuilder.ts](https://github.com/supabase/supabase-js/blob/v2.89.0/packages/core/postgrest-js/src/PostgrestTransformBuilder.ts),
  [PostgrestBuilder.ts](https://github.com/supabase/supabase-js/blob/v2.89.0/packages/core/postgrest-js/src/PostgrestBuilder.ts)):
  - `.single()` sends `Accept: application/vnd.pgrst.object+json`. Zero **or** several rows give
    PGRST116, so checking `code === 'PGRST116'` cannot tell "missing" from "duplicated".
  - `.maybeSingle()` on a GET asks for a plain array and resolves it on the client: 0 rows give
    `data: null, error: null`, 1 row gives the object, and more than 1 gives a synthetic PGRST116. On a
    write (`insert().select().maybeSingle()`) it uses the object header, and clears the error when its
    details say "0 rows".
  - Its type is `T | null`.
- tRPC and TanStack prescribe no "not found" shape. The two documented options are returning `null`, or
  throwing `NOT_FOUND`, which `TRPCError` maps to 404.

### 4. Query performance with PostgREST

- **Embedding is one SQL statement.** In PostgREST v14.1, each embed compiles to a
  `LEFT JOIN LATERAL` (`INNER` for `!inner`) subquery inside the same statement. A to-many embed is
  aggregated with `json_agg`
  ([QueryBuilder.hs](https://github.com/PostgREST/postgrest/blob/v14.1/src/PostgREST/Query/QueryBuilder.hs),
  `readPlanToQuery`).
  - So one `select()` with embeds is one round trip and one query plan. Several `from()` calls, or a
    loop of them, are separate HTTP requests.
  - The docs pitch embedding as "including related resources in a single API call"
    ([resource embedding](https://docs.postgrest.org/en/v14/references/api/resource_embedding.html)),
    and say it's better to let Postgres's "query planner figure out the details than to loop through
    rows yourself" ([PostgREST intro](https://docs.postgrest.org/en/v14/)).
  - Neither page names N+1. Its risk in supabase-js is the client-side loop: `Promise.all` over
    per-row queries.
- **Embedding rules** ([resource embedding](https://docs.postgrest.org/en/v14/references/api/resource_embedding.html)):
  - Joins are inferred from FKs.
  - Through a view, the FK columns must be in the view's top-level `SELECT`, and views with `UNION`
    may not embed.
  - Computed relationships (a `SETOF` function with `ROWS 1` for to-one) cover what FKs cannot.
  - An embedded filter shapes only the embed unless the embed is `!inner`.
- **Counting** ([pagination and count](https://docs.postgrest.org/en/v14/references/api/pagination_count.html)):
  - `exact` runs a real `COUNT(*)`, and "the larger the table the slower this query runs".
  - `planned` reads planner statistics, so it is fast but approximate; run `ANALYZE` to keep it close.
  - `estimated` is exact below `db-max-rows` and planned above it.
  - `head: true` returns no body, only the count (postgrest-js JSDoc:
    [PostgrestQueryBuilder.ts](https://github.com/supabase/supabase-js/blob/v2.89.0/packages/core/postgrest-js/src/PostgrestQueryBuilder.ts)).
  - With `range()` or `limit()`, `count` is the total of matching rows, not the page size.
- **Pagination**:
  - `range(from, to)` is 0-based and inclusive, and "if there is no order clause the range could behave
    unexpectedly" ([range](https://supabase.com/docs/reference/javascript/range)). It is offset
    pagination, sent as `limit` and `offset`.
  - The PostgREST pagination page does not cover keyset pagination. Building it from `.order()`,
    `.lt()`/`.gt()` on the sort key and `.limit()` is a derivation, not a documented pattern.
  - Supabase caps every response at `api.max_rows`, 1000 by default, and the cap covers "a view, table,
    or function" ([CLI config](https://supabase.com/docs/guides/local-development/cli/config)). An
    `.rpc()` returning a set is cut silently at that limit.
- **Columns**: `select('*')` is the default. Naming columns narrows both the payload and the inferred
  type; aliases are `alias:col` ([select](https://supabase.com/docs/reference/javascript/select)).
- **Functions** ([functions](https://docs.postgrest.org/en/v14/references/api/functions.html)):
  - Filters, `select`, `order` and embeds work on a table-valued function's output.
  - If the function can be inlined, the filters, order and limit are pushed into its query and use the
    table's indexes. Otherwise Postgres computes the full result and filters it afterwards.
  - Inlining needs, among other things, `LANGUAGE sql`, a single `SELECT`, and `STABLE`/`IMMUTABLE`
    for set-returning functions ([PG wiki: inlining](https://wiki.postgresql.org/wiki/Inlining_of_SQL_functions)).
    PL/pgSQL is never inlined.
  - A function that does not write can be called with GET (`rpc(fn, args, { get: true })`).
  - `record` returns cannot be filtered.
  - Overloads with the same argument names but different types are not supported.
- **Security of functions and views**:
  - Supabase: "Prefer `security invoker`, which is also the default". A `security definer` function
    "can return rows the caller isn't allowed to read", must set `search_path = ''`, and is executable
    by every role (including `anon`) unless `execute` is revoked
    ([database functions](https://supabase.com/docs/guides/database/functions)).
  - "Views bypass RLS by default because they are usually created with the `postgres` user". On
    Postgres 15 and later, set `security_invoker = true`
    ([RLS](https://supabase.com/docs/guides/database/postgres/row-level-security)).
  - RLS performance rules on the same page: index every column a policy filters on; wrap
    `auth.uid()`/`auth.jwt()` and definer helpers in `(select ...)` so Postgres evaluates them once per
    statement as an initPlan; name roles with `to`.
- **Measuring**: `.explain()` returns the plan. It needs
  `alter role authenticator set pgrst.db_plan_enabled to 'true'`, and stays off by default because a plan
  reveals schema details ([debugging performance](https://supabase.com/docs/guides/api/rest/debugging-performance)).

### 5. Alternatives: a SQL builder or ORM next to Supabase

- **Connection model.** Kysely and Drizzle connect to Postgres directly, not through PostgREST.
  Supabase offers:

  | Connection | Port | Used for | Prepared statements | Session state |
  |---|---|---|---|---|
  | Direct | 5432 | persistent backends; IPv6 only unless the IPv4 add-on is bought | yes | yes |
  | Shared pooler, session mode | 5432 | IPv4 | yes | yes |
  | Shared pooler, transaction mode | 6543 | serverless | no | no `SET`, no `LISTEN` |

  For serverless (Vercel), Supabase says: create the client once at module scope, use a pool of one
  connection, and turn off prepared statements
  ([connecting](https://supabase.com/docs/guides/database/connecting-to-postgres)). Its Drizzle guide uses
  the shared pooler with `prepare: false` ([Drizzle](https://supabase.com/docs/guides/database/drizzle)).
- **RLS and auth.** These connections log in as `postgres`, which "has admin privileges"
  ([roles](https://supabase.com/docs/guides/database/postgres/roles)). In Postgres, superusers and roles
  with `BYPASSRLS` always bypass RLS, and table owners do too unless the table has `FORCE ROW LEVEL
  SECURITY` ([PG 17 RLS](https://www.postgresql.org/docs/17/ddl-rowsecurity.html)). Tables created by
  migrations are owned by `postgres`
  ([database functions](https://supabase.com/docs/guides/database/functions)). So a direct query does not
  apply the user's policies unless the code recreates PostgREST's session itself. Drizzle documents that
  wrapper: in a transaction, `set_config('request.jwt.claims', ...)` and `set local role <role>`, then a
  reset ([Drizzle RLS](https://orm.drizzle.team/docs/rls)). It also ships Supabase role and table
  definitions in `drizzle-orm/supabase`.
- **Types.**
  - Drizzle's types come from its TypeScript schema.
  - Kysely needs a generator: `kysely-codegen`, `kysely-typegen` or `kanel-kysely`. Its docs do not
    mention Supabase ([generating types](https://kysely.dev/docs/generating-types)).
  - Either way it is a second type source next to `supabase gen types`. The LCU writers and Realtime
    keep using supabase-js.
- **Trade-off, stated factually.** A SQL builder gives arbitrary SQL, CTEs and transactions from
  TypeScript, which PostgREST exposes only through SQL functions. In exchange, the app takes on pooler
  configuration, a second schema or codegen path, and authorization in app code or in a role-switching
  transaction, where today PostgREST applies RLS.

## What this means for Derby

Mapping only; whether the current code does any of this is for the parallel review.

- **One typed `Database`, extended rather than bypassed.** Keep `db.ts` generated. Add a hand-written
  `MergeDeep` layer in `packages/supabase/src/types` that `Client` uses, for:
  - **jsonb columns** that have a known shape: auction `payload`, `rank_snapshot`, forum `content`;
  - **jsonb function returns**, such as `_auction_snapshot`;
  - **`RETURNS TABLE` columns that can really be NULL.** The generator always types these non-null.
  
  That puts the hand-written types in one file, next to the schema they describe. It needs `type-fest`
  as a dependency. A zod parse belongs only where the shape must be trusted at runtime.
- **Prefer inference to annotation.** Use `select('a, b, rel!inner(c)')` plus `QueryData<typeof q>` (or
  the router's inferred output) rather than interfaces written by hand. `.returns<T>()` is deprecated
  and unchecked; `overrideTypes` is the supported escape hatch.
- **`PostgrestVersion` defaults to 12** because local typegen omits `__InternalSupabase`, and
  `@supabase/ssr` 0.8's `createServerClient` has no generic for it. Only the `maxAffected` and to-many
  spread typings depend on it. Adding the key through the same `MergeDeep` layer should switch them on;
  this follows from `SupabaseClient.ts` but was not tested.
- **A query layer has first-party backing, though not from Supabase.** tRPC says to put shared logic in
  plain functions rather than callers, and Next.js recommends a `server-only` DAL that returns DTOs.
  - In this repo that layer would be functions taking the per-request `Client` and plain arguments, so
    RLS still runs as the user. Routers keep input validation, auth middleware and error mapping.
  - Whether that layer lives in a new `packages/db`, or in `packages/supabase` (whose `package.json`
    already exports `./queries` and `./mutations`, paths with no files behind them in `src/`), is an
    ownership choice. No source prescribes it.
  - The Supabase client cannot be a module singleton on the server, because it carries the request's
    cookies.
- **Errors.** Map `PostgrestError` in one place, then rethrow as a `TRPCError` with `cause`. A starting
  table: PGRST116/no row → `NOT_FOUND` or `null`; 23505 → `CONFLICT`; 23503/23514/22P02 → `BAD_REQUEST`;
  42501 → `FORBIDDEN`; `PTxxx` → that status; P0001 → `BAD_REQUEST` with a safe message. Never
  rethrow raw, because tRPC sends non-`TRPCError` messages to the client. For "not found",
  `.maybeSingle()` returns `null` without an error and keeps "duplicated" distinct from "missing", which
  `.single()` + PGRST116 does not. SQL functions that `RAISE` domain errors can choose their HTTP status
  and code with `ERRCODE = 'PTxxx'`, or carry a stable code in `HINT`/`DETAIL`, so the API maps on a code
  rather than on message text.
- **Output validators**: optional by tRPC's own account, paid on every response. They are worth it where
  the data is `Json` from the database and the client relies on its shape.
- **Context**: Supabase says not to trust `getSession()` on the server. `getUser()` costs a network call
  to Auth on every request. `getClaims()` verifies the JWT locally when the project uses asymmetric
  signing keys ([Next.js server-side auth](https://supabase.com/docs/guides/auth/server-side/nextjs)).
  tRPC builds the context once per HTTP batch. The RSC context is wrapped in React `cache()`.
- **Queries that hit the database**:
  - Prefer one embedded `select()` over several `from()` calls when the data is related; it is one SQL
    statement.
  - Use `count: 'exact', head: true` only where an exact total is needed, otherwise `planned` or
    `estimated`.
  - Remember the 1000-row cap on `.rpc()` sets.
  - Keep `.rpc()` set-returning functions `LANGUAGE sql STABLE` where client-side filters should reach
    the indexes; otherwise pass the filters as arguments.
  - Rating logic already lives in SQL by ADR. Read-model functions and views follow the same rules:
    `security invoker` by default, and `security_invoker = true` on views.
- **Alternatives**: a direct-connection builder would bypass RLS as `postgres` unless every query runs
  inside a role-switching transaction. It would also add a second type source next to the LCU's
  supabase-js writes. That cost is concrete, while the gain (SQL in TypeScript) is available today
  through migrations and `.rpc()`.

## Not verified

- The PostgREST version on the hosted project. Locally it is v14.1, from CLI 2.67.3; hosted projects can
  run an older major. The error codes, `maybeSingle` behaviour and embedding cited here hold from v12 on.
- Whether `supabase gen types --linked` (Management API) emits `__InternalSupabase`. Only the local path
  was read.
- How postgres-meta types a function **return** whose type is a domain. The column path resolves the
  base type; for function returns, the template's `pgTypeToTsType` looks the name up and likely falls
  through to `unknown`. Not tested.
- `MergeDeep` on `Functions` is not in Supabase's docs. It was confirmed only by the scratch typecheck
  described above, and not inside this repo.
- The cost of output validation: no tRPC source gives a figure. Only the mechanism (one parse per
  response) is from the source.
- tRPC's RSC page and TanStack's SSR page reference APIs newer than the installed versions
  (`unstable_createHydrateClient`, `queryClient.query()`). Their advice was used here, but not their code.
