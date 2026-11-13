import { listSeasons } from "@v1/supabase/queries/seasons";
import { createTRPCRouter, publicProcedure } from "../trpc";

export const seasonsRouter = createTRPCRouter({
  list: publicProcedure.query(({ ctx }) => listSeasons(ctx.supabase)),
});
