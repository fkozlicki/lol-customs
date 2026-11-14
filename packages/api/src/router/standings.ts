import { getStandings } from "@v1/supabase/queries/standings";
import { z } from "zod";
import { seasonInput } from "../season";
import { createTRPCRouter, publicProcedure } from "../trpc";

export const standingsRouter = createTRPCRouter({
  /** The track's standings, live or right after its `afterMatches`-th match. */
  get: publicProcedure
    .input(
      z.object({
        season: seasonInput,
        limit: z.number().min(1).max(200).default(50),
        afterMatches: z.number().int().min(1).max(100_000).optional(),
      }),
    )
    .query(({ ctx, input }) =>
      getStandings(ctx.supabase, {
        track: input.season,
        limit: input.limit,
        afterMatches: input.afterMatches,
      }),
    ),
});
