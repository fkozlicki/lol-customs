import { listMatches, listPlayerMatches } from "@v1/supabase/queries/matches";
import { z } from "zod";
import { seasonInput } from "../season";
import { createTRPCRouter, publicProcedure } from "../trpc";

export const matchesRouter = createTRPCRouter({
  list: publicProcedure
    .input(
      z.object({
        season: seasonInput,
        cursor: z.string().nullish(),
        limit: z.number().min(1).max(100).default(10),
      }),
    )
    .query(({ ctx, input }) =>
      listMatches(ctx.supabase, {
        track: input.season,
        limit: input.limit,
        cursor: input.cursor,
      }),
    ),

  listByPuuid: publicProcedure
    .input(
      z.object({
        puuid: z.string().min(1),
        season: seasonInput,
        cursor: z.number().nullish(),
        limit: z.number().min(1).max(100).default(10),
      }),
    )
    .query(({ ctx, input }) =>
      listPlayerMatches(ctx.supabase, {
        puuid: input.puuid,
        track: input.season,
        limit: input.limit,
        cursor: input.cursor,
      }),
    ),
});
