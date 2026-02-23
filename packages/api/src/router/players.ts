import { TRPCError } from "@trpc/server";
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

  getByRiotId: publicProcedure
    .input(
      z.object({ gameName: z.string().min(1), tagLine: z.string().min(1) }),
    )
    .query(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabase
        .from("players")
        .select("*")
        .ilike("game_name", input.gameName)
        .ilike("tag_line", input.tagLine)
        .single();
      if (error) {
        if (error.code === "PGRST116") return null;
        throw error;
      }
      return data;
    }),

  profileStats: publicProcedure
    .input(z.object({ puuid: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabase
        .from("ratings")
        .select(
          "*, player:players!inner(puuid, game_name, tag_line, profile_icon, first_seen_at, last_seen_at)",
        )
        .eq("puuid", input.puuid)
        .single();
      if (error) {
        if (error.code === "PGRST116") return null;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error.message,
        });
      }
      return data;
    }),

  ratingHistory: publicProcedure
    .input(z.object({ puuid: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabase
        .from("rating_history")
        .select("rating_after, created_at")
        .eq("puuid", input.puuid)
        .order("created_at", { ascending: true });

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error.message,
        });
      }

      return data;
    }),

  mostPlayedChampions: publicProcedure
    .input(
      z.object({
        puuid: z.string().min(1),
        limit: z.number().min(1).max(20).default(5),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabase
        .from("match_participants")
        .select(
          "champion_id, kills, deaths, assists, match:matches!inner(match_id, teams(team_id, win)), team_id",
        )
        .eq("puuid", input.puuid);
      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error.message,
        });
      }

      const map = new Map<
        number,
        {
          games: number;
          wins: number;
          kills: number;
          deaths: number;
          assists: number;
        }
      >();

      for (const row of data) {
        const champId = row.champion_id;
        if (champId == null) continue;

        const teams = Array.isArray(row.match)
          ? (
              row.match[0] as {
                teams: { team_id: number; win: boolean }[];
              } | null
            )?.teams
          : (row.match as { teams: { team_id: number; win: boolean }[] } | null)
              ?.teams;

        const won = teams?.find((t) => t.team_id === row.team_id)?.win ?? false;

        const entry = map.get(champId) ?? {
          games: 0,
          wins: 0,
          kills: 0,
          deaths: 0,
          assists: 0,
        };
        entry.games += 1;
        if (won) entry.wins += 1;
        entry.kills += row.kills ?? 0;
        entry.deaths += row.deaths ?? 0;
        entry.assists += row.assists ?? 0;
        map.set(champId, entry);
      }

      return Array.from(map.entries())
        .map(([championId, stats]) => ({ championId, ...stats }))
        .sort((a, b) => b.games - a.games)
        .slice(0, input.limit);
    }),
});
