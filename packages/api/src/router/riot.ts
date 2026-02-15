import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { getPlayerProfile, getSummonerByPuuid } from "../riot-client";
import { createTRPCRouter, publicProcedure } from "../trpc";

export const riotRouter = createTRPCRouter({
  getPlayerProfile: publicProcedure
    .input(
      z.object({
        puuid: z.string().min(1),
        platformId: z.string().min(1),
      }),
    )
    .query(async ({ input }) => {
      const profile = await getPlayerProfile(input.puuid, input.platformId);
      if (!profile) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Summoner not found for this PUUID on the given platform",
        });
      }
      return profile;
    }),

  getSummonerByPuuid: publicProcedure
    .input(
      z.object({
        puuid: z.string().min(1),
        platformId: z.string().min(1),
      }),
    )
    .query(async ({ input }) => {
      const summoner = await getSummonerByPuuid(input.puuid, input.platformId);
      if (!summoner) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Summoner not found",
        });
      }
      return summoner;
    }),
});
