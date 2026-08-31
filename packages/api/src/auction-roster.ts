import {
  getAccountByRiotId,
  getRankedEntriesByPuuid,
  mapWithConcurrency,
  platformIdToRegion,
} from "./riot-client";

const RANKED_SOLO_QUEUE = "RANKED_SOLO_5x5";
const RIOT_CONCURRENCY = 2;
const CACHE_TTL_MS = 60_000;

export interface AuctionRosterInput {
  gameName: string;
  tagLine: string;
  platformId: string;
}

export interface AuctionRosterSnapshot extends AuctionRosterInput {
  puuid: string;
  soloTier: string | null;
  soloDivision: string | null;
  soloRankLabel: string;
}

const rosterCache = new Map<
  string,
  { loadedAt: number; snapshot: AuctionRosterSnapshot }
>();

function rankLabel(tier: string | null, division: string | null): string {
  if (!tier) return "";
  if (["MASTER", "GRANDMASTER", "CHALLENGER"].includes(tier.toUpperCase())) {
    return tier;
  }
  return division ? `${tier} ${division}` : tier;
}

export async function loadAuctionRoster(
  roster: AuctionRosterInput[],
): Promise<AuctionRosterSnapshot[]> {
  return mapWithConcurrency(roster, RIOT_CONCURRENCY, async (player) => {
    const platformId = player.platformId.trim().toLowerCase();
    const cacheKey = `${player.gameName.trim().toLowerCase()}#${player.tagLine.trim().toLowerCase()}@${platformId}`;
    const cached = rosterCache.get(cacheKey);
    if (cached && Date.now() - cached.loadedAt < CACHE_TTL_MS) {
      return { ...cached.snapshot };
    }

    const account = await getAccountByRiotId(
      platformIdToRegion(platformId),
      player.gameName.trim(),
      player.tagLine.trim(),
    );

    if (!account) {
      throw new Error(
        `Riot ID not found: ${player.gameName.trim()}#${player.tagLine.trim()}`,
      );
    }

    const entries = await getRankedEntriesByPuuid(account.puuid, platformId);
    const solo = entries.find((entry) => entry.queueType === RANKED_SOLO_QUEUE);
    const soloTier = solo?.tier?.trim() || null;
    const soloDivision = solo?.rank?.trim() || null;

    const snapshot = {
      puuid: account.puuid,
      gameName: account.gameName,
      tagLine: account.tagLine,
      platformId,
      soloTier,
      soloDivision,
      soloRankLabel: rankLabel(soloTier, soloDivision),
    };
    rosterCache.set(cacheKey, { loadedAt: Date.now(), snapshot });
    return { ...snapshot };
  });
}
