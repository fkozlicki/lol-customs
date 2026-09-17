import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { isAllTime, seasonInput } from "../season";
import { createTRPCRouter, publicProcedure } from "../trpc";

const afterGamesSchema = z.number().int().min(1).max(100_000);

function toIsoDate(value: string): string {
  return new Date(value).toISOString();
}

interface HallOfFameEntry {
  player: {
    puuid: string;
    game_name: string | null;
    tag_line: string | null;
    profile_icon: number | null;
  };
  value: number;
}

export const riftRankRouter = createTRPCRouter({
  /** Row count in `matches` for the season — drives the "1 … N, live" picker (same cardinality as ladder games if every row is one rated game). */
  ladderRatedMatchCount: publicProcedure
    .input(z.object({ season: seasonInput }))
    .query(async ({ ctx, input }) => {
      let query = ctx.supabase
        .from("matches")
        .select("*", { count: "exact", head: true });
      if (!isAllTime(input.season)) {
        query = query.eq("ladder_season_id", input.season);
      }
      const { count, error } = await query;

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error.message,
        });
      }

      const n = count ?? 0;
      if (!Number.isFinite(n) || n < 0) {
        return 0;
      }
      return Math.min(n, 100_000);
    }),

  leaderboard: publicProcedure
    .input(
      z.object({
        season: seasonInput,
        limit: z.number().min(1).max(200).default(50),
        afterGames: afterGamesSchema.optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { season, limit, afterGames } = input;

      if (afterGames) {
        const offset = afterGames - 1;
        let matchQuery = ctx.supabase.from("matches").select("match_id");
        if (!isAllTime(season)) {
          matchQuery = matchQuery.eq("ladder_season_id", season);
        }
        const { data: matchRows, error: matchError } = await matchQuery
          .order("game_creation", { ascending: true })
          .order("match_id", { ascending: true })
          .range(offset, offset);

        if (matchError) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: matchError.message,
          });
        }

        const targetMatchId = matchRows?.[0]?.match_id;
        if (targetMatchId == null) {
          return [];
        }

        const { data: endSnapshot, error: endError } = await ctx.supabase
          .from("rating_history")
          .select("created_at")
          .eq("match_id", targetMatchId)
          .eq("ladder_season_id", season)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (endError) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: endError.message,
          });
        }

        const snapshotAt = endSnapshot?.created_at;
        if (!snapshotAt) {
          return [];
        }

        const { data, error } = await ctx.supabase.rpc("leaderboard_at", {
          p_at: toIsoDate(snapshotAt),
          p_track: season,
          p_limit: limit,
        });

        if (error) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: error.message,
          });
        }

        return (data ?? []).map((row) => ({
          puuid: row.puuid,
          rating: row.rating,
          wins: row.wins,
          losses: row.losses,
          best_streak: row.best_streak,
          win_streak: row.win_streak,
          lose_streak: row.lose_streak,
          updated_at: row.updated_at,
          avg_kills: row.avg_kills,
          avg_deaths: row.avg_deaths,
          avg_assists: row.avg_assists,
          mvp_games: row.mvp_games,
          ace_games: row.ace_games,
          matches_played: row.wins + row.losses,
          qualified: row.qualified,
          player: {
            puuid: row.puuid,
            game_name: row.game_name,
            tag_line: row.tag_line,
            profile_icon: row.profile_icon,
            platform_id: row.platform_id,
          },
        }));
      }

      const { data, error } = await ctx.supabase
        .from("ratings")
        .select(
          "puuid, rating, wins, losses, best_streak, win_streak, lose_streak, updated_at, avg_kills, avg_deaths, avg_assists, mvp_games, ace_games, matches_played, qualified, player:players!inner(puuid, game_name, tag_line, profile_icon, platform_id)",
        )
        .eq("ladder_season_id", season)
        .not("rating", "is", null)
        .order("qualified", { ascending: false })
        .order("rating", { ascending: false })
        .limit(limit);

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error.message,
        });
      }

      // Qualified players keep rating order; players still qualifying go by matches played.
      return data
        .map((row) => ({
          ...row,
          matches_played: row.matches_played ?? 0,
          qualified: row.qualified ?? false,
        }))
        .sort((a, b) => {
          if (a.qualified !== b.qualified) return a.qualified ? -1 : 1;
          const byRating = (b.rating ?? 0) - (a.rating ?? 0);
          return a.qualified
            ? byRating
            : b.matches_played - a.matches_played || byRating;
        });
    }),

  /** Hall of Fame titles on a track: every holder (ties share) and every runner-up, qualified players only. */
  hallOfFame: publicProcedure
    .input(z.object({ season: seasonInput }))
    .query(async ({ ctx, input }) => {
      const { data: rows, error } = await ctx.supabase.rpc("hall_of_fame", {
        p_track: input.season,
      });
      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error.message,
        });
      }

      const puuids = [...new Set(rows.map((row) => row.puuid))];
      const { data: players, error: playersError } =
        puuids.length > 0
          ? await ctx.supabase
              .from("players")
              .select("puuid, game_name, tag_line, profile_icon")
              .in("puuid", puuids)
          : { data: [], error: null };
      if (playersError) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: playersError.message,
        });
      }

      const playerByPuuid = new Map(players.map((p) => [p.puuid, p]));
      const titles = new Map<
        string,
        {
          holders: HallOfFameEntry[];
          runnersUp: HallOfFameEntry[];
        }
      >();

      for (const row of rows) {
        const entry = {
          player: playerByPuuid.get(row.puuid) ?? {
            puuid: row.puuid,
            game_name: null,
            tag_line: null,
            profile_icon: null,
          },
          value: Number(row.value),
        };
        const title = titles.get(row.title) ?? { holders: [], runnersUp: [] };
        (row.rank === 1 ? title.holders : title.runnersUp).push(entry);
        titles.set(row.title, title);
      }

      return Object.fromEntries(titles);
    }),
});
