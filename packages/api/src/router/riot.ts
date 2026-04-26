import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  getPlayerProfile,
  getPlayerRankByRiotId,
  getSummonerByPuuid,
  mapWithConcurrency,
} from "../riot-client";
import { createTRPCRouter, publicProcedure } from "../trpc";

const riotRegionSchema = z.enum(["europe", "americas", "asia", "sea"]);

const randomTeamPlayerSchema = z.object({
  gameName: z.string().min(1),
  tagLine: z.string().min(1),
  platformId: z.string().min(1),
});

const rosterTenUniqueSchema = z.object({
  players: z
    .array(randomTeamPlayerSchema)
    .length(10)
    .refine(
      (players) => {
        const keys = new Set(
          players.map(
            (p) =>
              `${p.gameName.trim().toLowerCase()}#${p.tagLine.trim().toLowerCase()}`,
          ),
        );
        return keys.size === 10;
      },
      { message: "Each player must be unique (same Riot ID only once)." },
    ),
});

const RIOT_RANK_FETCH_CONCURRENCY = 2;

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

  /**
   * Fetch Solo/Duo entries for exactly 10 roster players with bounded Riot concurrency.
   * Client runs team shuffle locally after this succeeds.
   */
  loadRosterRanks: publicProcedure
    .input(rosterTenUniqueSchema)
    .mutation(async ({ input }) => {
      try {
        const players = await mapWithConcurrency(
          input.players,
          RIOT_RANK_FETCH_CONCURRENCY,
          async (p) => {
            const gameName = p.gameName.trim();
            const tagLine = p.tagLine.trim();
            const platformId = p.platformId.trim().toLowerCase();
            const entries = await getPlayerRankByRiotId(gameName, tagLine, {
              platformId,
            });
            return { gameName, tagLine, platformId, entries };
          },
        );
        return { players };
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Riot API request failed";
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message,
        });
      }
    }),
});
