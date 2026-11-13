import "server-only";
import { isAllTime } from "@v1/domain/season";
import type { Client } from "../types";

/** A player as other players' records name them; the name is null for a player not in `players`. */
export type PlayerRef = {
  puuid: string;
  game_name: string | null;
  tag_line: string | null;
  profile_icon: number | null;
};

/** Names for the given players, keyed by puuid. A puuid with no `players` row gets a nameless ref. */
export async function playerRefs(
  client: Client,
  puuids: string[],
): Promise<(puuid: string) => PlayerRef> {
  const unique = [...new Set(puuids)];
  const { data, error } =
    unique.length > 0
      ? await client
          .from("players")
          .select("puuid, game_name, tag_line, profile_icon")
          .in("puuid", unique)
      : { data: [], error: null };
  if (error) throw error;

  const byPuuid = new Map(data.map((player) => [player.puuid, player]));
  return (puuid) =>
    byPuuid.get(puuid) ?? {
      puuid,
      game_name: null,
      tag_line: null,
      profile_icon: null,
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

export async function findPlayerByRiotId(
  client: Client,
  riotId: { gameName: string; tagLine: string },
) {
  const { data, error } = await client
    .from("players")
    .select("*")
    .ilike("game_name", riotId.gameName)
    .ilike("tag_line", riotId.tagLine)
    .limit(2);
  if (error) throw error;
  // `ilike` treats `%` and `_` as wildcards, so a Riot ID can match several players; that is not a
  // profile. A lookup by normalised Riot ID replaces this (docs/research/api-layer-review.md).
  return data.length === 1 ? data[0] : null;
}

/** A player's rating on one track, with their name and standings position; null if never rated. */
export async function getProfileStats(
  client: Client,
  puuid: string,
  track: number,
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
  puuid: string,
  track: number,
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

/** Final standing per season (last rating snapshot in that season), oldest season first. */
export async function getSeasonSummaries(client: Client, puuid: string) {
  const { data, error } = await client
    .from("rating_history")
    .select("ladder_season_id, rating_after, wins, losses")
    .eq("puuid", puuid)
    .gt("ladder_season_id", 0)
    .order("created_at", { ascending: false })
    .order("match_id", { ascending: false });
  if (error) throw error;

  const bySeason = new Map<number, (typeof data)[number]>();
  for (const row of data) {
    if (!bySeason.has(row.ladder_season_id)) {
      bySeason.set(row.ladder_season_id, row);
    }
  }

  return [...bySeason.values()]
    .map((row) => ({
      seasonId: row.ladder_season_id,
      rating: row.rating_after,
      wins: row.wins,
      losses: row.losses,
    }))
    .sort((a, b) => a.seasonId - b.seasonId);
}

/** Teammates and rivals on a rating track; only qualified players are named. */
export async function getRelations(
  client: Client,
  puuid: string,
  track: number,
) {
  const { data: rows, error } = await client.rpc("player_relations", {
    p_puuid: puuid,
    p_track: track,
  });
  if (error) throw error;

  const player = await playerRefs(
    client,
    rows.map((row) => row.other_puuid),
  );
  const relation = (name: string) => {
    const row = rows.find((r) => r.relation === name);
    if (!row) return null;
    return {
      player: player(row.other_puuid),
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
  puuid: string,
  track: number,
  limit: number,
) {
  let query = client
    .from("match_participants")
    .select(
      "champion_id, kills, deaths, assists, team_id, match:matches!inner(ladder_season_id, teams(team_id, win))",
    )
    .eq("puuid", puuid);
  if (!isAllTime(track)) {
    query = query.eq("match.ladder_season_id", track);
  }
  const { data, error } = await query;
  if (error) throw error;

  const byChampion = new Map<
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
    if (row.champion_id == null) continue;
    const won =
      row.match.teams.find((team) => team.team_id === row.team_id)?.win ??
      false;
    const entry = byChampion.get(row.champion_id) ?? {
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
    byChampion.set(row.champion_id, entry);
  }

  return Array.from(byChampion.entries())
    .map(([championId, stats]) => ({ championId, ...stats }))
    .sort((a, b) => b.games - a.games)
    .slice(0, limit);
}
