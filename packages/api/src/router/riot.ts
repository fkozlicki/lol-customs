import { z } from "zod";
import { getPlayerRankByRiotId } from "../riot-client";
import { createTRPCRouter, publicProcedure } from "../trpc";

const riotRegionSchema = z.enum(["europe", "americas", "asia", "sea"]);

export const riotRouter = createTRPCRouter({
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
      const entries = await getPlayerRankByRiotId(
        input.gameName,
        input.tagLine,
        {
          region: input.region,
          platformId: input.platformId,
        },
      );
      return entries;
    }),
});
