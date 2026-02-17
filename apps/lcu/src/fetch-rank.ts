import { createLcuClient } from "./lcu.js";

/** Minimal shape for ranked-overview; LCU returns queues with tier/division. */
interface RankedOverviewQueue {
  queueType?: string;
  tier?: string;
  division?: string;
}

interface RankedOverviewResponse {
  queues?: RankedOverviewQueue[];
}

const RANKED_SOLO_QUEUE_TYPE = "RANKED_SOLO_5x5";

export async function fetchRankForSummoner(
  lolDirectory: string,
  summonerId: number,
): Promise<{ rank_tier: string; rank_division: string } | null> {
  try {
    const client = createLcuClient(lolDirectory);
    const res = await client.get<RankedOverviewResponse>(
      `/lol-ranked/v1/ranked-overview/${summonerId}`,
    );
    const data = res.data;
    const queues = data?.queues ?? [];
    const solo = queues.find(
      (q) => q.queueType === RANKED_SOLO_QUEUE_TYPE,
    ) as RankedOverviewQueue | undefined;
    if (solo?.tier != null && solo?.division != null) {
      return {
        rank_tier: String(solo.tier),
        rank_division: String(solo.division),
      };
    }
    return null;
  } catch (err) {
    console.warn(`Rank fetch failed for summoner ${summonerId}:`, err);
    return null;
  }
}
