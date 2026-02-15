import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";

export const playersRouter = createTRPCRouter({
  all: publicProcedure.query(async ({ ctx }) => {
    const { data, error } = await ctx.supabase
      .from("players")
      .select("*")
      .order("last_seen_at", { ascending: false });
    if (error) throw error;
    return data;
  }),

  getByPuuid: publicProcedure
    .input(z.object({ puuid: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabase
        .from("players")
        .select("*")
        .eq("puuid", input.puuid)
        .single();
      if (error) {
        if (error.code === "PGRST116") return null;
        throw error;
      }
      return data;
    }),
});
