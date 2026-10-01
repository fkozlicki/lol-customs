# 0007 — Pages are composed in the app, from recipes and self-contained blocks

- Status: accepted
- Date: 2026-10-01
- Amends: [0004](0004-packages-ui-is-the-design-system.md)

## Context

ADR 0004 moved everything visual into `packages/ui` and left `apps/app` with containers and mappers.
Taken to its end, that put whole pages into recipes. `AuctionListPage` rendered the shell, the header,
the connection badge, the create button and the list's loading, error, empty and ready states, all
driven by six props. The container behind it read the list with `useQuery`, folded `isLoading` and
`isError` into a `state` prop, and wired the button's routing and sign-in back in as callbacks. The
page prefetched nothing, so the list loaded on the client every time, unlike every page that follows
the prefetch-and-hydrate pattern.

The rest of the app already worked differently. `hof`, `matches`, `posts` and `shuffle` put `PageShell`
and `PageHeader` together in `page.tsx` and suspend a container under a skeleton.

## Decision

1. **A recipe is a piece, not a page.** Which blocks a page has and where they go (`PageShell`,
   `PageHeader` and what sits in it) is decided in `apps/app`: in `page.tsx`, or in a header component
   beside the page's containers when the header holds blocks of its own (`AuctionsHeader`, a server
   component). Where a recipe frames something with behaviour, it takes it as a slot
   (`AuctionSummaryList`'s `emptyAction`).
2. **A component whose point is behaviour lives in the app.** A primitive wired to routing, the session
   or a mutation, with no look of its own (`CreateAuctionButton`: a `Button` and an icon that opens
   `/auctions/new` or asks a visitor to sign in), is the app's. Anything with a look worth a story is
   still a recipe.
3. **A block of data is self-contained.** Its container owns a `QueryBoundary` (Suspense with the
   block's skeleton, plus an error boundary with the block's error recipe and a retry) around a child
   that reads with `useSuspenseQuery`. The page prefetches the queries and places the block, which
   takes no props for loading or failure.
4. **Live data comes from a provider on the page.** `AuctionLive` holds the realtime subscription for a
   topic and invalidates the query it keeps current, on each broadcast and on a timer while realtime is
   down. The blocks under it read their query as usual, and the badge reads the connection with
   `useAuctionLive`.

## Why

- **The page reads as what it shows.** `auctions/page.tsx` is a prefetch and four blocks. Moving,
  dropping or reusing one is a change to that file, not a new prop threaded through a page recipe.
- **The boundary sits in the container because the retry is a function.** A server component cannot
  pass `(retry) => <AuctionListError onRetry={retry} />` to a client boundary, so the block that knows
  its error recipe holds the boundary.
- **Freshness is said once.** "This page follows `auction:list`" is one element, not a hook whose
  refetch callback is passed to every piece that changes the data.
- **Recipes stay plain.** A button that only routes has nothing to show in Storybook that `Button`
  does not; its story would have been a test of the app's callback.

## Consequences

- `AuctionListPage` and the recipe `CreateAuctionButton` are gone; the list body is
  `AuctionSummaryList`, and `AuctionListEmpty` takes an `action` slot. The strings the app now renders
  (`dashboard.pages.auctions.title`, `description`, `create`) moved to `apps/app/src/locales`.
- `apps/app/src/components` holds its first server component (`AuctionsHeader`).
- `apps/app` depends on `react-error-boundary`, which `QueryBoundary` uses.
- The other auction routes (`/auctions/[id]`, `/auctions/new`) still read with `useQuery`. The
  whole-page skeletons (`auction-room-skeleton`, `new-auction-skeleton`, `player-profile-skeleton`)
  still wrap `PageShell`, and pages other than `/auctions` still suspend in `page.tsx` without an error
  boundary. Each is revisited with its page.
