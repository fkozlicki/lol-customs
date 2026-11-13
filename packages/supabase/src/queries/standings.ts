import "server-only";
import { isAllTime } from "@v1/domain/season";
import { withStandingsPositions } from "@v1/domain/standings";
import type { Client, Database } from "../types";
import { type PlayerRef, playerRef } from "./players";

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

/** Matches on a rating track, capped at 100 000; drives the "after N matches" picker. */
export async function countTrackMatches(client: Client, track: number) {
  let query = client
    .from("matches")
    .select("*", { count: "exact", head: true });
  if (!isAllTime(track)) {
    query = query.eq("ladder_season_id", track);
  }
  const { count, error } = await query;
  if (error) throw error;
  return Math.min(count ?? 0, 100_000);
}

/**
 * The standings of one rating track, live or as they stood right after its Nth match.
 *
 * Both come from `leaderboard_at` (`standings_after_match` finds when the Nth match was rated), so the ordering rule lives in SQL only: qualified players first by
 * rating, everyone else by matches played, with a deterministic tie-break.
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

/** The Hall of Fame of one rating track: each title's holders, with the value that earned it. */
export async function getHallOfFame(client: Client, track: number) {
  const { data: rows, error } = await client.rpc("hall_of_fame", {
    p_track: track,
  });
  if (error) throw error;

  const titles = new Map<string, { player: PlayerRef; value: number }[]>();
  for (const row of rows) {
    const entry = {
      player: playerRef(row.puuid, row),
      value: Number(row.value),
    };
    titles.set(row.title, [...(titles.get(row.title) ?? []), entry]);
  }
  return Object.fromEntries(titles);
}
