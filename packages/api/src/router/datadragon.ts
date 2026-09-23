import { getChampionMap, getCurrentPatch } from "../datadragon";
import { createTRPCRouter, publicProcedure } from "../trpc";

export const datadragonRouter = createTRPCRouter({
  currentPatch: publicProcedure.query(() => getCurrentPatch()),

  championMap: publicProcedure.query(() => getChampionMap()),
});
