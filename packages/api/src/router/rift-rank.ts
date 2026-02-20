import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";

interface LeaderboardRatingRow {
  puuid: string;
  rating: number | null;
  wins: number | null;
  losses: number | null;
  best_streak: number | null;
  win_streak: number | null;
  lose_streak: number | null;
  updated_at: string | null;
  avg_kills: number | null;
  avg_deaths: number | null;
  avg_assists: number | null;
}

interface LeaderboardEntry extends LeaderboardRatingRow {
  player: {
    puuid: string;
    game_name: string | null;
    tag_line: string | null;
    profile_icon: number | null;
    platform_id: string | null;
  } | null;
}

export const riftRankRouter = createTRPCRouter({
  leaderboard: publicProcedure
    .input(
      z
        .object({
          limit: z.number().min(1).max(200).default(50),
        })
        .optional(),
    )
    .query(async ({ ctx, input }): Promise<LeaderboardEntry[]> => {
      const limit = input?.limit ?? 50;
      const { data: ratings, error: ratingsError } = await ctx.supabase
        .from("ratings")
        .select(
          "puuid, rating, wins, losses, best_streak, win_streak, lose_streak, updated_at, avg_kills, avg_deaths, avg_assists",
        )
        .not("rating", "is", null)
        .order("rating", { ascending: false })
        .limit(limit);

      if (ratingsError) throw ratingsError;
      const rawRows = ratings ?? [];
      if (!rawRows.length) return [];
      const rows: LeaderboardRatingRow[] = rawRows as LeaderboardRatingRow[];
      const puuids = rows.map((r) => r.puuid);
      const { data: playersData, error: playersError } = await ctx.supabase
        .from("players")
        .select("puuid, game_name, tag_line, profile_icon, platform_id")
        .in("puuid", puuids);
      if (playersError) throw playersError;
      type PlayerRow = { puuid: string; game_name: string | null; tag_line: string | null; profile_icon: number | null; platform_id: string | null };
      const players = (playersData ?? []) as PlayerRow[];
      const playerMap = new Map(players.map((p) => [p.puuid, p]));
      const result: LeaderboardEntry[] = [];
      for (let i = 0; i < rows.length; i++) {
        const r = rows[i]!;
        result.push({
          ...r,
          player: playerMap.get(r.puuid) ?? null,
        });
      }
      return result;
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
