import { TRPCError } from "@trpc/server";
import { withStandingsPositions } from "@v1/domain/standings";
import { z } from "zod";
import { isAllTime, seasonInput } from "../season";
import {
  type createTRPCContext,
  createTRPCRouter,
  publicProcedure,
} from "../trpc";

const afterGamesSchema = z.number().int().min(1).max(100_000);

type LeaderboardAtRow = {
  puuid: string;
  rating: number;
  wins: number;
  losses: number;
  best_streak: number;
  win_streak: number;
  lose_streak: number;
  updated_at: string;
  avg_kills: number | null;
  avg_deaths: number | null;
  avg_assists: number | null;
  mvp_games: number;
  ace_games: number;
  game_name: string | null;
  tag_line: string | null;
  profile_icon: number | null;
  platform_id: string | null;
  qualified: boolean;
};

function toLeaderboardRow(row: LeaderboardAtRow) {
  return {
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
  };
}

/**
 * When the Nth match of the track was applied, so the standings can be replayed as they stood then.
 * Null when that match, or a rating snapshot for it, does not exist.
 */
async function snapshotAfterMatch(
  supabase: Awaited<ReturnType<typeof createTRPCContext>>["supabase"],
  season: number,
  afterGames: number,
): Promise<string | null> {
  const offset = afterGames - 1;
  let matchQuery = supabase.from("matches").select("match_id");
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
  if (targetMatchId == null) return null;

  const { data, error } = await supabase
    .from("rating_history")
    .select("created_at")
    .eq("match_id", targetMatchId)
    .eq("ladder_season_id", season)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: error.message,
    });
  }

  return data?.created_at ? new Date(data.created_at).toISOString() : null;
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

  /**
   * Season standings on one rating track.
   *
   * Both the live board and a historical snapshot come from `leaderboard_at`, so the ordering rule
   * lives in SQL only: qualified players first by rating, everyone else by matches played, with a
   * deterministic tie-break. `afterGames` picks the snapshot taken right after the Nth match.
   */
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

      const at = afterGames
        ? await snapshotAfterMatch(ctx.supabase, season, afterGames)
        : new Date().toISOString();

      if (!at) return [];

      const { data, error } = await ctx.supabase.rpc("leaderboard_at", {
        p_at: at,
        p_track: season,
        p_limit: limit,
      });

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error.message,
        });
      }

      return withStandingsPositions((data ?? []).map(toLeaderboardRow));
    }),

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
      const titles = new Map<string, HallOfFameEntry[]>();

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
        titles.set(row.title, [...(titles.get(row.title) ?? []), entry]);
      }

      return Object.fromEntries(titles);
    }),
});
