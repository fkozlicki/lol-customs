import { auctionsRouter } from "./router/auctions";
import { forumRouter } from "./router/forum";
import { hallOfFameRouter } from "./router/hall-of-fame";
import { matchesRouter } from "./router/matches";
import { playersRouter } from "./router/players";
import { seasonsRouter } from "./router/seasons";
import { standingsRouter } from "./router/standings";
import { userProfilesRouter } from "./router/user-profiles";
import { createTRPCRouter } from "./trpc";

export const appRouter = createTRPCRouter({
  auctions: auctionsRouter,
  players: playersRouter,
  matches: matchesRouter,
  standings: standingsRouter,
  hallOfFame: hallOfFameRouter,
  userProfiles: userProfilesRouter,
  forum: forumRouter,
  seasons: seasonsRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
