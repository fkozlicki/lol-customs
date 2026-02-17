import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  getPlayerProfile,
  getPlayerRankByRiotId,
  getSummonerByPuuid,
} from "../riot-client";
import { createTRPCRouter, publicProcedure } from "../trpc";

const riotRegionSchema = z.enum(["europe", "americas", "asia", "sea"]);

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

  /** Get ranked entries (Solo/Duo, Flex, etc.) by Riot ID (gameName#tagLine). */
  getPlayerRankByRiotId: publicProcedure
    .input(
      z.object({
        gameName: z.string().min(1),
        tagLine: z.string().min(1),
        region: riotRegionSchema.optional(),
        platformId: z.string().optional(),
      }),
    )
    .query(async ({ input }) => {
      const entries = await getPlayerRankByRiotId(input.gameName, input.tagLine, {
        region: input.region,
        platformId: input.platformId,
      });
      return entries;
    }),
});
