import { getHallOfFame } from "@v1/supabase/queries/hall-of-fame";
import { z } from "zod";
import { seasonInput } from "../season";
import { createTRPCRouter, publicProcedure } from "../trpc";

export const hallOfFameRouter = createTRPCRouter({
  /** Each title's holders on the track. */
  get: publicProcedure
    .input(z.object({ season: seasonInput }))
    .query(({ ctx, input }) => getHallOfFame(ctx.supabase, input.season)),
});
