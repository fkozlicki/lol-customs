import "server-only";
import { ALL_TIME_SEASON } from "@v1/domain/season";
import type { Client } from "../types";

/** A player as other players' records name them; the name is null for a player not in `players`. */
export type PlayerRef = {
  puuid: string;
  game_name: string | null;
  tag_line: string | null;
  profile_icon: number | null;
};

/** One player on one rating track (a season id, or 0 for all time). */
export type PlayerOnTrack = { puuid: string; track: number };

/** The other player of a record, from the name columns a read model returns beside their puuid. */
export function playerRef(
  puuid: string,
  row: Omit<PlayerRef, "puuid">,
): PlayerRef {
  return {
    puuid,
    game_name: row.game_name,
    tag_line: row.tag_line,
    profile_icon: row.profile_icon,
  };
}

/** Every known player with their last recorded Solo/Duo rank, most recently seen first. */
export async function listPlayers(client: Client) {
  const [players, ranks] = await Promise.all([
    client
      .from("players")
      .select("*")
      .order("last_seen_at", { ascending: false }),
    client.rpc("player_latest_ranks"),
  ]);
  if (players.error) throw players.error;
  if (ranks.error) throw ranks.error;

  const rankByPuuid = new Map(ranks.data.map((row) => [row.puuid, row]));
  return players.data.map((player) => {
    const rank = rankByPuuid.get(player.puuid);
    return {
      ...player,
      rank_tier: rank?.rank_tier ?? null,
      rank_division: rank?.rank_division ?? null,
    };
  });
}

/**
 * A player's Solo/Duo rank as of their latest match that carried one. Derby Sync records it with
 * every match, so a profile reads it here instead of calling the Riot API on every page view. It is
 * the rank at that match, not now: a player who has not played for a month shows a month-old rank,
 * and there is no LP.
 */
export async function getSoloRank(client: Client, puuid: string) {
  // player_latest_ranks() is a plain SQL function, so Postgres inlines it and applies the filter
  // inside it rather than ranking every player and discarding all but one.
  const { data, error } = await client
    .rpc("player_latest_ranks")
    .eq("puuid", puuid)
    .maybeSingle();
  if (error) throw error;
  return data ? { tier: data.rank_tier, division: data.rank_division } : null;
}

/** The player who carries this Riot ID now, matched without case or surrounding spaces. */
export async function findPlayerByRiotId(
  client: Client,
  riotId: { gameName: string; tagLine: string },
) {
  const { data, error } = await client
    .rpc("player_by_riot_id", {
      p_game_name: riotId.gameName,
      p_tag_line: riotId.tagLine,
    })
    .maybeSingle();
  if (error) throw error;
  return data;
}

/** A player's rating on one track, with their name and standings position; null if never rated. */
export async function getProfileStats(
  client: Client,
  { puuid, track }: PlayerOnTrack,
) {
  const { data, error } = await client
    .from("ratings")
    .select(
      "*, player:players!inner(puuid, game_name, tag_line, profile_icon, first_seen_at, last_seen_at)",
    )
    .eq("puuid", puuid)
    .eq("ladder_season_id", track)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;

  const { data: position, error: positionError } = await client.rpc(
    "standings_position",
    { p_puuid: puuid, p_track: track },
  );
  if (positionError) throw positionError;

  return { ...data, position: position ?? null };
}

/** A player's rating after each match on one track, oldest first. */
export async function getRatingHistory(
  client: Client,
  { puuid, track }: PlayerOnTrack,
) {
  const { data, error } = await client
    .from("rating_history")
    .select("rating_after, created_at")
    .eq("puuid", puuid)
    .eq("ladder_season_id", track)
    .order("created_at", { ascending: true })
    .order("match_id", { ascending: true });
  if (error) throw error;
  return data;
}

/** A player's rating and record at the end of each season they played, oldest season first. */
export async function getSeasonSummaries(client: Client, puuid: string) {
  const { data, error } = await client
    .from("ratings")
    .select("ladder_season_id, rating, wins, losses")
    .eq("puuid", puuid)
    .neq("ladder_season_id", ALL_TIME_SEASON)
    .order("ladder_season_id", { ascending: true });
  if (error) throw error;

  return data.map((row) => ({
    seasonId: row.ladder_season_id,
    rating: row.rating,
    wins: row.wins,
    losses: row.losses,
  }));
}

/** Teammates and rivals on a rating track; only qualified players are named. */
export async function getRelations(
  client: Client,
  { puuid, track }: PlayerOnTrack,
) {
  const { data: rows, error } = await client.rpc("player_relations", {
    p_puuid: puuid,
    p_track: track,
  });
  if (error) throw error;

  const relation = (name: string) => {
    const row = rows.find((r) => r.relation === name);
    if (!row) return null;
    return {
      player: playerRef(row.other_puuid, row),
      matches: row.matches,
      wins: row.wins,
      losses: row.losses,
      kills: row.kills,
    };
  };

  const bestRecord = relation("best_head_to_head");
  const worstRecord = relation("worst_head_to_head");

  return {
    teammates: {
      mostMatches: relation("most_matches_with"),
      mostWins: relation("most_wins_with"),
      mostLosses: relation("most_losses_with"),
    },
    rivals: {
      bestRecord,
      // With a single eligible rival, the best and worst record are the same player.
      worstRecord:
        worstRecord?.player.puuid === bestRecord?.player.puuid
          ? null
          : worstRecord,
      mostKilled: relation("most_killed"),
      mostKilledBy: relation("most_killed_by"),
    },
  };
}

/** A player's champions on one track by games played, with wins and total KDA. */
export async function getMostPlayedChampions(
  client: Client,
  { puuid, track, limit }: PlayerOnTrack & { limit: number },
) {
  const { data, error } = await client.rpc("player_champions", {
    p_puuid: puuid,
    p_track: track,
    p_limit: limit,
  });
  if (error) throw error;

  return data.map((row) => ({
    championId: row.champion_id,
    games: row.matches,
    wins: row.wins,
    kills: row.kills,
    deaths: row.deaths,
    assists: row.assists,
  }));
}
