import { datadragonRouter } from "./router/datadragon";
import { duosRouter } from "./router/duos";
import { forumRouter } from "./router/forum";
import { matchesRouter } from "./router/matches";
import { playersRouter } from "./router/players";
import { riftRankRouter } from "./router/rift-rank";
import { riotRouter } from "./router/riot";
import { userProfilesRouter } from "./router/user-profiles";
import { createTRPCRouter } from "./trpc";

export const appRouter = createTRPCRouter({
  players: playersRouter,
  matches: matchesRouter,
  riftRank: riftRankRouter,
  duos: duosRouter,
  riot: riotRouter,
  datadragon: datadragonRouter,
  userProfiles: userProfilesRouter,
  forum: forumRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
