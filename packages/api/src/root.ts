import { auctionsRouter } from "./router/auctions";
import { forumRouter } from "./router/forum";
import { matchesRouter } from "./router/matches";
import { playersRouter } from "./router/players";
import { riftRankRouter } from "./router/rift-rank";
import { seasonsRouter } from "./router/seasons";
import { userProfilesRouter } from "./router/user-profiles";
import { createTRPCRouter } from "./trpc";

export const appRouter = createTRPCRouter({
  auctions: auctionsRouter,
  players: playersRouter,
  matches: matchesRouter,
  riftRank: riftRankRouter,
  userProfiles: userProfilesRouter,
  forum: forumRouter,
  seasons: seasonsRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
