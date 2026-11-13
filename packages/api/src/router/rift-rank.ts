import {
  countTrackMatches,
  getHallOfFame,
  getStandings,
} from "@v1/supabase/queries/standings";
import { z } from "zod";
import { seasonInput } from "../season";
import { createTRPCRouter, publicProcedure } from "../trpc";

export const riftRankRouter = createTRPCRouter({
  /** Matches on the track; drives the "after N matches" picker. */
  ladderRatedMatchCount: publicProcedure
    .input(z.object({ season: seasonInput }))
    .query(({ ctx, input }) => countTrackMatches(ctx.supabase, input.season)),

  /** The track's standings, live or right after its `afterGames`-th match. */
  leaderboard: publicProcedure
    .input(
      z.object({
        season: seasonInput,
        limit: z.number().min(1).max(200).default(50),
        afterGames: z.number().int().min(1).max(100_000).optional(),
      }),
    )
    .query(({ ctx, input }) =>
      getStandings(ctx.supabase, {
        track: input.season,
        limit: input.limit,
        afterMatches: input.afterGames,
      }),
    ),

  hallOfFame: publicProcedure
    .input(z.object({ season: seasonInput }))
    .query(({ ctx, input }) => getHallOfFame(ctx.supabase, input.season)),
});
