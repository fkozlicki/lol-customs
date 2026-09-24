# 0002 — Game assets are not mirrored

- Status: accepted
- Date: 2026-09-24

## Context

Every comparable site — op.gg, u.gg, blitz.gg, deeplol, porofessor — serves game art from a host it
controls, keyed by patch. The obvious move for Derby would be the same: copy Riot's champion, item,
spell and profile-icon art into our own storage and serve it from there.

Those sites mirror for reasons Derby does not have: millions of requests, per-request transforms (op.gg
crops Riot's border off every portrait), and not depending on a volunteer CDN at that scale. Derby serves
a group of about thirty.

## Decision

1. **Champion, item, spell and profile-icon art stays on Data Dragon**, Riot's authorised source,
   addressed by patch. `next/image` resizes it, re-encodes it as webp and serves it from our own domain
   with a 31-day cache — the part of a mirror that matters to a reader, without owning the bytes.
2. **Rank crests, role icons and objective icons are self-hosted** under `apps/app/public/game/`. They are
   a small fixed set that Data Dragon does not carry, so they are downloaded once from a pinned Community
   Dragon version by `apps/app/scripts/generate-game-data.ts`, never from its moving `latest`.
3. **They are Riot's files, as published — not redrawn.** Monochrome icons of our own would sit closer to
   DESIGN.md's graphite and paper; the owner chose Riot's.
4. **The champion list is generated into the repository** (`apps/app/src/game-data/champions.ts`) rather
   than downloaded at runtime, and the patch is fetched once an hour on the server.

## Why not a mirror

- Measured on the running app, `next/image` alone took a page of match history from 2,147 KB of images to
  49 KB, and one 32 px portrait from 25,644 bytes to 370. A mirror would not do better.
- A mirror adds a failure a hotlink cannot have: art that goes missing or stale because an ingest job
  failed, noticed only when a portrait is blank. Profile icons alone are over five thousand files.
- Riot's developer policy puts no restriction on either approach, so there is no compliance reason to own
  the files.

## Consequences

- A champion released after `champions.ts` was generated shows a placeholder until the generator is run
  again.
- Image optimisation runs on Vercel and counts against its limits; with patch-addressed URLs cached for a
  month, a group this size stays far inside them.
- Revisit if Derby wants transforms `next/image` cannot do (op.gg's border crop), or if those limits start
  to bite. Switching origin is a change to `apps/app/src/utils/asset-urls.ts` alone.
