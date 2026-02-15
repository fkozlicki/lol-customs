import { datadragonRouter } from "./router/datadragon";
import { ladderRouter } from "./router/ladder";
import { matchesRouter } from "./router/matches";
import { playersRouter } from "./router/players";
import { riotRouter } from "./router/riot";
import { createTRPCRouter } from "./trpc";

export const appRouter = createTRPCRouter({
  players: playersRouter,
  matches: matchesRouter,
  ladder: ladderRouter,
  riot: riotRouter,
  datadragon: datadragonRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
