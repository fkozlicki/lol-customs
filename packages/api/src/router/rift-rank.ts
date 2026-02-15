import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";

export const riftRankRouter = createTRPCRouter({
  leaderboard: publicProcedure
    .input(
      z
        .object({
          limit: z.number().min(1).max(200).default(50),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      const limit = input?.limit ?? 50;
      const { data: ratings, error: ratingsError } = await ctx.supabase
        .from("ratings")
        .select(
          "puuid, rating, wins, losses, best_streak, win_streak, lose_streak, updated_at",
        )
        .not("rating", "is", null)
        .order("rating", { ascending: false })
        .limit(limit);

      if (ratingsError) throw ratingsError;
      if (!ratings?.length) return [];
      const puuids = ratings.map((r) => r.puuid);
      const { data: players, error: playersError } = await ctx.supabase
        .from("players")
        .select("puuid, game_name, tag_line, profile_icon, platform_id")
        .in("puuid", puuids);
      if (playersError) throw playersError;
      const playerMap = new Map((players ?? []).map((p) => [p.puuid, p]));
      return ratings.map((r) => ({
        ...r,
        player: playerMap.get(r.puuid) ?? null,
      }));
    }),

  getByPuuid: publicProcedure
    .input(z.object({ puuid: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabase
        .from("ratings")
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
