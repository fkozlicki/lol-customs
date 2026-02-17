import { createLcuClient } from "./lcu.js";

/** Frame-by-frame timeline from LCU. Typed loosely; store as JSONB. */
export type GameTimelineJson = Record<string, unknown>;

export async function fetchTimeline(
  lolDirectory: string,
  gameId: number,
): Promise<GameTimelineJson | null> {
  try {
    const client = createLcuClient(lolDirectory);
    const res = await client.get<GameTimelineJson>(
      `/lol-match-history/v1/game-timelines/${gameId}`,
    );
    return res.data ?? null;
  } catch (err) {
    console.warn(`Timeline fetch failed for game ${gameId}:`, err);
    return null;
  }
}
