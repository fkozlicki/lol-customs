import {
  findPlayerByRiotId,
  getMostPlayedChampions,
  getProfileStats,
  getRatingHistory,
  getRelations,
  getSeasonSummaries,
  getSoloRank,
  listPlayers,
} from "@v1/supabase/queries/players";
import { z } from "zod";
import { seasonInput } from "../season";
import { createTRPCRouter, publicProcedure } from "../trpc";

const puuidInput = z.object({ puuid: z.string().min(1) });
const onTrackInput = puuidInput.extend({ season: seasonInput });

export const playersRouter = createTRPCRouter({
  all: publicProcedure.query(({ ctx }) => listPlayers(ctx.supabase)),

  soloRank: publicProcedure
    .input(puuidInput)
    .query(({ ctx, input }) => getSoloRank(ctx.supabase, input.puuid)),

  getByRiotId: publicProcedure
    .input(
      z.object({ gameName: z.string().min(1), tagLine: z.string().min(1) }),
    )
    .query(({ ctx, input }) => findPlayerByRiotId(ctx.supabase, input)),

  profileStats: publicProcedure
    .input(onTrackInput)
    .query(({ ctx, input }) =>
      getProfileStats(ctx.supabase, input.puuid, input.season),
    ),

  ratingHistory: publicProcedure
    .input(onTrackInput)
    .query(({ ctx, input }) =>
      getRatingHistory(ctx.supabase, input.puuid, input.season),
    ),

  seasonSummaries: publicProcedure
    .input(puuidInput)
    .query(({ ctx, input }) => getSeasonSummaries(ctx.supabase, input.puuid)),

  relations: publicProcedure
    .input(onTrackInput)
    .query(({ ctx, input }) =>
      getRelations(ctx.supabase, input.puuid, input.season),
    ),

  mostPlayedChampions: publicProcedure
    .input(
      onTrackInput.extend({
        limit: z.number().min(1).max(20).default(5),
      }),
    )
    .query(({ ctx, input }) =>
      getMostPlayedChampions(
        ctx.supabase,
        input.puuid,
        input.season,
        input.limit,
      ),
    ),
});
