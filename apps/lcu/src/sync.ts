import { createLcuClient } from "./lcu.js";
import type { LcuMatchDetails } from "./lcu-types.js";
import { saveMatch } from "./save-match.js";

interface MatchSummary {
  gameId: number;
  gameType: string;
}

interface MatchHistoryResponse {
  games: { games: MatchSummary[] };
}

async function fetchCustomMatches(
  lolDirectory: string,
): Promise<MatchSummary[]> {
  const client = createLcuClient(lolDirectory);
  return client
    .get<MatchHistoryResponse>(
      "/lol-match-history/v1/products/lol/current-summoner/matches",
    )
    .then((res) =>
      res.data.games.games.filter((g) => g.gameType === "CUSTOM_GAME"),
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

export interface SyncResult {
  success: boolean;
  message: string;
  savedCount?: number;
  skippedCount?: number;
}

export async function runSync(lolDirectory: string): Promise<SyncResult> {
  try {
    const matches = await fetchCustomMatches(lolDirectory);
    let saved = 0;
    let skipped = 0;

    for (const match of matches) {
      const data = await fetchMatchDetails(lolDirectory, match.gameId);
      const didSave = await saveMatch(data);
      if (didSave) saved += 1;
      else skipped += 1;
    }

    return {
      success: true,
      message: "Sync complete.",
      savedCount: saved,
      skippedCount: skipped,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Sync failed.";
    return { success: false, message };
  }
}
