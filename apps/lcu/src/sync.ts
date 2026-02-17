import { createLcuClient } from "./lcu.js";
import type { LcuMatchDetails } from "./lcu-types.js";
import { fetchRankForParticipant } from "./fetch-rank.js";
import { fetchTimeline } from "./fetch-timeline.js";
import { saveMatch } from "./save-match.js";
import { supabase } from "./supabase.js";

export interface GameForUi {
  match: LcuMatchDetails;
  isSaved: boolean;
}

export interface FetchGamesResult {
  games: GameForUi[];
}

interface MatchHistoryResponse {
  games: { games: LcuMatchDetails[] };
}

const CUSTOM_GAME_QUEUE_ID = 3120;

async function fetchCustomMatches(
  lolDirectory: string,
): Promise<LcuMatchDetails[]> {
  const client = createLcuClient(lolDirectory);
  return client
    .get<MatchHistoryResponse>(
      "/lol-match-history/v1/products/lol/current-summoner/matches",
    )
    .then((res) =>
      res.data.games.games.filter((g) => g.queueId === CUSTOM_GAME_QUEUE_ID),
    );
}

async function fetchMatchDetails(
  lolDirectory: string,
  gameId: number,
): Promise<LcuMatchDetails> {
  const client = createLcuClient(lolDirectory);
  return client
    .get<LcuMatchDetails>(`/lol-match-history/v1/games/${gameId}`)
    .then((res) => res.data);
}

export async function fetchGamesForUi(
  lolDirectory: string,
): Promise<FetchGamesResult> {
  const matches = await fetchCustomMatches(lolDirectory);
  const gameIds = matches.map((m) => m.gameId);
  if (gameIds.length === 0) {
    return { games: [] };
  }

  const { data: savedRows } = await supabase
    .from("matches")
    .select("match_id")
    .in("match_id", gameIds);

  const savedSet = new Set(
    (savedRows ?? []).map((r) => r.match_id as number),
  );

  const games: GameForUi[] = matches.map((match) => ({
    match,
    isSaved: savedSet.has(match.gameId),
  }));

  return { games };
}

export interface SyncResult {
  success: boolean;
  message: string;
  savedCount?: number;
  skippedCount?: number;
  errorCount?: number;
  errors?: string[];
}

export async function saveSelectedMatches(
  lolDirectory: string,
  gameIds: number[],
): Promise<SyncResult> {
  if (gameIds.length === 0) {
    return {
      success: true,
      message: "No games selected.",
      savedCount: 0,
    };
  }

  let saved = 0;
  const errors: string[] = [];

  for (const gameId of gameIds) {
    try {
      const [details, timelineRaw] = await Promise.all([
        fetchMatchDetails(lolDirectory, gameId),
        fetchTimeline(lolDirectory, gameId),
      ]);

      const timeline = timelineRaw ?? {};

      const participantRanks = new Map<
        string,
        { rank_tier: string; rank_division: string }
      >();
      const platformId = details.platformId ?? "eun1";
      for (const identity of details.participantIdentities) {
        const gameName = identity.player.gameName;
        const tagLine = identity.player.tagLine;
        if (!gameName?.trim() || !tagLine?.trim()) continue;
        const rank = await fetchRankForParticipant(
          gameName,
          tagLine,
          platformId,
        );
        if (rank) {
          participantRanks.set(identity.player.puuid, rank);
        }
      }

      const result = await saveMatch(details, {
        timeline,
        participantRanks:
          participantRanks.size > 0 ? participantRanks : undefined,
      });
      if (result.saved) {
        saved += 1;
      } else {
        errors.push(`Game ${gameId}: ${result.error}`);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`Game ${gameId}: ${msg}`);
    }
  }

  const errorCount = errors.length;
  return {
    success: errorCount === 0,
    message:
      errorCount === 0
        ? `Saved ${saved} match${saved === 1 ? "" : "es"}.`
        : `Saved ${saved}; ${errorCount} failed.`,
    savedCount: saved,
    errorCount: errorCount > 0 ? errorCount : undefined,
    errors: errors.length > 0 ? errors : undefined,
  };
}
