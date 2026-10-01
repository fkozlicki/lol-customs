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
   (`AuctionSummaryList`'s `emptyAction`). The same holds below the page: a recipe that only arranges
   other recipes and passes their props through is a composition, and compositions are the app's.
   The test is whether most of its props go straight to its children (`AuctionSetup` had nineteen).
2. **A component whose point is behaviour lives in the app.** A primitive wired to routing, the session
   or a mutation, with no look of its own (`CreateAuctionButton`: a `Button` and an icon that opens
   `/auctions/new` or asks a visitor to sign in), is the app's. Anything with a look worth a story is
   still a recipe. A callback that only navigates is an `href` instead: a recipe may render
   `next/link` (`LiveAuctionNotice`).
3. **The page places a block's boundary.** It prefetches the queries and wraps the container that
   reads them with `useSuspenseQuery` in a `QueryBoundary`: Suspense with the block's skeleton, plus an
   error boundary with the block's error recipe. Retrying is behaviour, so it follows rule 2: the error
   recipe takes an `action` slot, and the app's `QueryRetryButton` reads the retry from the boundary
   with `useQueryRetry`. A block without an error recipe of its own gets the default, `QueryError`.
   A page about one entity (a post, a room) awaits `prefetchQuery` and calls `notFound()` when the
   cached result is null; `prefetchQuery` does not throw, so a failure still reaches the boundary.
   `(dashboard)/not-found.tsx` renders the `NotFound` recipe inside the dashboard's chrome.
4. **Live data comes from a provider on the page.** `AuctionLive` holds the realtime subscription for a
   topic and invalidates the query it keeps current, on each broadcast and on a timer while realtime is
   down. The blocks under it read their query as usual, and the badge reads the connection with
   `useAuctionLive`.

## Why

- **The page reads as what it shows.** `auctions/page.tsx` is a prefetch and four blocks. Moving,
  dropping or reusing one is a change to that file, not a new prop threaded through a page recipe.
- **The retry travels by context because it is a function.** A server page cannot pass
  `(retry) => <AuctionListError onRetry={retry} />` to a client boundary, but it can pass
  `<AuctionListError action={<QueryRetryButton />} />`: elements only, with the function created on the
  client. The container stays a plain reader, and the page shows what loads where.
- **Freshness is said once.** "This page follows `auction:list`" is one element, not a hook whose
  refetch callback is passed to every piece that changes the data.
- **Recipes stay plain.** A button that only routes has nothing to show in Storybook that `Button`
  does not; its story would have been a test of the app's callback.

## Consequences

- `AuctionListPage` and the recipe `CreateAuctionButton` are gone; the list body is
  `AuctionSummaryList`, and `AuctionListEmpty` takes an `action` slot. The strings the app now renders
  (`dashboard.pages.auctions.title`, `description`, `create`) moved to `apps/app/src/locales`.
- `apps/app/src/components` holds its first server component (`AuctionsHeader`).
- `apps/app` depends on `react-error-boundary`, which `QueryBoundary` uses. `AuctionListError` takes an
  `action` slot instead of `onRetry`, and the app's retry label is `dashboard.retry`.
- `posts/[id]` reads its post through the query cache (it used `caller`, so the client read it again)
  and suspends in a `QueryBoundary`.
- `/auctions/new` prefetches the ladder and the active auctions. `NewAuction` decides between the
  live-auction notice and the form; `AuctionSetupForm` only reads the ladder, so the lobby's pool
  editor suspends in a `QueryBoundary`. `NewAuctionSkeleton` became `AuctionSetupSkeleton`, the form
  alone, and `loading.tsx` puts the shell and header skeleton around it.
- The room (`/auctions/[id]`) awaits its room and answers a missing one with a 404, and keeps it
  current through `AuctionLive` with the room's topic. The page places `PageShell`, so
  `AuctionRoomSkeleton` and `AuctionRoomClosed` lost their own shell and padding.
  `AuctionRoomHeader` takes `status` and `action` slots (`AuctionLiveBadge`, the app's
  `CancelAuctionButton`), and `AuctionRoomNotFound` is gone. Room actions and the lobby read
  `refresh` from `useAuctionLive`.
- The forum's `NewPostButton` moved to the app, with the same sign-in-first logic as
  `CreateAuctionButton`; `PostList` and `PostListEmpty` take it through slots.
- Every page places its blocks in a `QueryBoundary`, and no skeleton wraps `PageShell` any more:
  `PlayerProfileSkeleton` lost its shell too, and the profile's `loading.tsx` adds it. The forum list
  prefetched `{ limit: 20 }` while its container read `{ limit: 10 }`, so the prefetch never hit;
  both read ten now.
- `AuctionSetup`, `DrawBoard` and `DrawToolbar` are gone. `AuctionSetupForm` and `DrawTool` arrange
  the pieces themselves (`LobbyChangeNotice`, `PickerCount`, `AuctionRules`, `DrawnTeam`, their own
  buttons), and the pool they share — the picked players beside the ladder and the Riot ID field —
  is the app's `PlayerPoolPicker`, which takes `usePlayerPicker`'s result and a namespace of words.
  `AuctionRules` and `LobbyChangeNotice` got stories of their own; the words the app now passes moved
  to `dashboard.pages.auctions.picker` and `dashboard.pages.shuffle.picker`.
- Known gap: the home page awaits `fetchQuery(ladderRatedMatchCount)` and the player profile awaits
  `fetchQuery(profileStats)`. Both throw past every boundary to `global-error` when they fail.
