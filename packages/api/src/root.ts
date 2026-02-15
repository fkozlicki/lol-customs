import { datadragonRouter } from "./router/datadragon";
import { matchesRouter } from "./router/matches";
import { playersRouter } from "./router/players";
import { riotRouter } from "./router/riot";
import { riftRankRouter } from "./router/rift-rank";
import { createTRPCRouter } from "./trpc";

export const appRouter = createTRPCRouter({
  players: playersRouter,
  matches: matchesRouter,
  riftRank: riftRankRouter,
  riot: riotRouter,
  datadragon: datadragonRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
