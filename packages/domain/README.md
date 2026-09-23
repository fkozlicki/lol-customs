# @v1/domain

Pure Derby logic: rank maths, Riot IDs, season resolution, the shuffle draw, stat formatting.

It is a leaf on purpose. No Supabase, no tRPC, no React, no Next — so `apps/app`, `packages/api` and
`apps/lcu` can all import it, and so Derby Sync's renderer bundle stays free of the server stack.

Terms come from [CONTEXT.md](../../CONTEXT.md). Note the distinction the glossary makes between a
**Rank** (Riot's Solo/Duo tier, decoration) and a **Rating** (the ladder Elo).

Run `bun test` here, or `bun run test` from the repo root.
