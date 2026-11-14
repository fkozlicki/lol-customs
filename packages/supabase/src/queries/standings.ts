import "server-only";
import { withStandingsPositions } from "@v1/domain/standings";
import type { Client, Database } from "../types";

type LeaderboardAtRow =
  Database["public"]["Functions"]["leaderboard_at"]["Returns"][number];

function toStandingsRow(row: LeaderboardAtRow) {
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
 * The standings of one rating track, live or as they stood right after its Nth match.
 *
 * Both come from `leaderboard_at`, so the ordering rule lives in SQL only: qualified players first by
 * rating, everyone else by matches played, with a deterministic tie-break. `standings_after_match`
 * finds when the Nth match was rated.
 */
export async function getStandings(
  client: Client,
  args: { track: number; limit: number; afterMatches?: number },
) {
  const { data, error } = args.afterMatches
    ? await client.rpc("standings_after_match", {
        p_track: args.track,
        p_matches: args.afterMatches,
        p_limit: args.limit,
      })
    : await client.rpc("leaderboard_at", {
        p_at: new Date().toISOString(),
        p_track: args.track,
        p_limit: args.limit,
      });
  if (error) throw error;

  return withStandingsPositions(data.map(toStandingsRow));
}
