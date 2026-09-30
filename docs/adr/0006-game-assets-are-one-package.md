# 0006 — Game-asset knowledge is one package

- Status: accepted
- Date: 2026-09-30

## Context

What the app knows about game assets — the champion list, which Data Dragon file a summoner spell is,
how each asset's URL is built, which icons are self-hosted, and which patch to draw them from — had
spread over eight places in three workspaces:

- the champion list, the URL builders and the spell table sat in the design system's
  `recipes/game-assets`, next to the image components, because those were their first users;
- the app's server code imported that data from the UI tier to fetch the latest patch and to find the
  champions behind the backdrop, and an app script wrote the generated list into the UI package's source;
- "which patch?" had three answers: the app fetched it on the server with a fallback to the generated
  patch, the image components defaulted to the same fallback, and Derby Sync fetched it again in the
  browser with a fallback two years stale;
- Derby Sync kept its own copy of the spell table and its own URL builders, because lint rightly keeps it
  out of the recipes — so ADR 0002's "switching origin is a change to one file" was no longer true.

## Decision

1. **`packages/game-assets` (`@v1/game-assets`) owns the knowledge.** Plain TypeScript with no React, no
   Next and no workspace imports: the generated champion list and `champion(id)`, the summoner spell table,
   every URL builder and `SELF_HOSTED_PATHS`, and `latestPatch()`.
2. **`latestPatch({ init, fetch })` answers "which patch?" once.** It fetches Data Dragon's versions, and
   on any failure returns the patch the champion list was generated from, which is always real. The app
   calls it with Next's hourly revalidation in the dashboard layout; Derby Sync calls it in the browser.
3. **Each generator writes only into its own workspace.** The package generates its champion list; the
   app downloads the icons it serves into its own `public/game`, for the same patch. `bun
   generate:game-data` runs both.
4. **Displaying stays in the design system.** The image recipes and `GamePatchProvider` import the
   package; Derby Sync imports it directly and draws champion art from Data Dragon, as the app does.

## Why

- **Locality.** Changing where an asset comes from, adding a spell or a champion, or changing how the
  patch is chosen is a change to one package, and the app, the design system and Derby Sync all follow.
- **Dependencies point the right way.** The design system displays; the package knows. App code no longer
  reaches into the UI tier for data, and no script writes into another workspace's source.
- **One interface, three adapters.** The app's server, Derby Sync's browser and the image recipes all use
  the same functions; `latestPatch` takes its `fetch` as a parameter, so its fallback is tested without
  the network.

Considered and rejected:

- **`@v1/domain`.** It holds Derby's rules — standings, ratings, the draw — and the design system may not
  import it (ADR 0004). Riot's file names are neither.
- **Leaving it in `packages/ui`.** The app would keep importing data from the UI tier, and Derby Sync
  could never share it.

## Consequences

- A champion released since the last `bun generate:game-data` shows a placeholder everywhere until it is
  run again.
- Derby Sync picks up changes to the package only with its next installer.
- The package's own lint forbids React, Next and workspace imports, so it stays usable by every consumer.
