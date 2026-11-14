import "server-only";
import { isAllTime } from "@v1/domain/season";
import type { Client } from "../types";

/**
 * What a match card reads: every match column except Riot's match and timeline JSON, which weigh about
 * 125 kB a match and stay in the database, with the sides and the participants.
 */
const MATCH_CARD_SELECT =
  "match_id, platform_id, game_creation, duration, game_mode, game_type, queue_id, map_id, patch, season_id, end_of_game_result, created_at, ladder_season_id, teams(*), match_participants(*, players(game_name, tag_line, profile_icon))" as const;

/** Participants in the order of the match's scoreboard. */
function byParticipantId<T extends { participant_id: number | null }>(
  participants: T[],
): T[] {
  return participants.sort(
    (a, b) => (a.participant_id ?? 0) - (b.participant_id ?? 0),
  );
}

/** Adds each participant's rating change on the given track (null when the match is not on it). */
async function withRatingChanges<
  T extends { match_id: number; match_participants: { puuid: string }[] },
>(
  client: Client,
  matches: T[],
  track: number,
): Promise<
  Array<
    Omit<T, "match_participants"> & {
      match_participants: Array<
        T["match_participants"][number] & { rating_change: number | null }
      >;
    }
  >
> {
  const changes = new Map<string, number>();
  if (matches.length > 0) {
    const { data, error } = await client.rpc("rating_changes", {
      p_match_ids: matches.map((m) => m.match_id),
      p_track: track,
    });
    if (error) throw error;
    for (const row of data) {
      changes.set(`${row.match_id}:${row.puuid}`, row.rating_change);
    }
  }

  return matches.map((m) => ({
    ...m,
    match_participants: m.match_participants.map((p) => ({
      ...p,
      rating_change: changes.get(`${m.match_id}:${p.puuid}`) ?? null,
    })),
  }));
}

/** A page of a track's matches, newest first; the cursor is the last match's `game_creation`. */
export async function listMatches(
  client: Client,
  args: { track: number; limit: number; cursor?: string | null },
) {
  let query = client
    .from("matches")
    .select(MATCH_CARD_SELECT)
    .order("game_creation", { ascending: false })
    .limit(args.limit + 1);
  if (!isAllTime(args.track)) {
    query = query.eq("ladder_season_id", args.track);
  }
  if (args.cursor) {
    query = query.lt("game_creation", args.cursor);
  }
  const { data, error } = await query;
  if (error) throw error;

  const items = data.map((m) => ({
    ...m,
    match_participants: byParticipantId(m.match_participants),
  }));
  const hasNextPage = items.length > args.limit;
  const lastItem = hasNextPage ? items[args.limit - 1] : undefined;

  return {
    items: await withRatingChanges(
      client,
      items.slice(0, args.limit),
      args.track,
    ),
    nextCursor: lastItem?.game_creation ?? null,
  };
}

/** A page of one player's matches on a track, newest first; the cursor is the last `match_id`. */
export async function listPlayerMatches(
  client: Client,
  args: { puuid: string; track: number; limit: number; cursor?: number | null },
) {
  // The player's match ids first, paged by match_id, which grows with every upload.
  let participantQuery = client
    .from("match_participants")
    .select("match_id, match:matches!inner(ladder_season_id)")
    .eq("puuid", args.puuid)
    .order("match_id", { ascending: false })
    .limit(args.limit + 1);
  if (!isAllTime(args.track)) {
    participantQuery = participantQuery.eq(
      "match.ladder_season_id",
      args.track,
    );
  }
  if (args.cursor != null) {
    participantQuery = participantQuery.lt("match_id", args.cursor);
  }
  const { data: participantRows, error: participantError } =
    await participantQuery;
  if (participantError) throw participantError;

  const hasNextPage = participantRows.length > args.limit;
  const rows = participantRows.slice(0, args.limit);
  if (rows.length === 0) {
    return { items: [], nextCursor: null };
  }

  // Then those matches, with every participant.
  const { data, error } = await client
    .from("matches")
    .select(MATCH_CARD_SELECT)
    .in(
      "match_id",
      rows.map((r) => r.match_id),
    )
    .order("game_creation", { ascending: false });
  if (error) throw error;

  const items = data.map((m) => ({
    ...m,
    match_participants: byParticipantId(m.match_participants),
  }));
  const lastMatchId = hasNextPage ? rows[rows.length - 1]?.match_id : null;

  return {
    items: await withRatingChanges(client, items, args.track),
    nextCursor: lastMatchId ?? null,
  };
}

/** Matches on a rating track, capped at 100 000; drives the "after N matches" picker. */
export async function countMatches(client: Client, track: number) {
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
