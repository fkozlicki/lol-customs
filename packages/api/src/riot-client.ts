/**
 * Simple fetch-based client for Riot API (account, summoner + ranked).
 * Server-only: uses RIOT_API_KEY from env (set by the app).
 */

const RIOT_PLATFORM_BASE = "https://{platform}.api.riotgames.com";
const RIOT_REGIONAL_BASE = "https://{region}.api.riotgames.com";

const RANK_CACHE_TTL_MS = 60_000;
const rankCache = new Map<string, { at: number; data: RiotLeagueEntry[] }>();

/** Account API (regional: europe, americas, asia, sea) */
export type RiotRegion = "europe" | "americas" | "asia" | "sea";

/** Map platform host (e.g. eun1, na1) to Account API region. */
export function platformIdToRegion(platformId: string): RiotRegion {
  const upper = (platformId ?? "").toUpperCase();
  if (["EUN1", "EUW1", "TR1", "RU"].some((p) => upper.startsWith(p))) {
    return "europe";
  }
  if (["NA1", "BR1", "LA1", "LA2"].some((p) => upper.startsWith(p))) {
    return "americas";
  }
  if (["KR", "JP1"].some((p) => upper.startsWith(p))) {
    return "asia";
  }
  if (
    ["OC1", "PH2", "SG2", "TH2", "TW2", "VN2"].some((p) => upper.startsWith(p))
  ) {
    return "sea";
  }
  return "europe";
}

export interface RiotAccount {
  puuid: string;
  gameName: string;
  tagLine: string;
}

export interface RiotSummoner {
  id: string;
  accountId: string;
  puuid: string;
  name: string;
  profileIconId: number;
  revisionDate: number;
  summonerLevel: number;
}

export interface RiotLeagueEntry {
  leagueId: string;
  summonerId: string;
  summonerName: string;
  queueType: string;
  tier: string;
  rank: string;
  leaguePoints: number;
  wins: number;
  losses: number;
  hotStreak: boolean;
  veteran: boolean;
  freshBlood: boolean;
  inactive: boolean;
  puuid?: string;
  miniSeries?: {
    losses: number;
    progress: string;
    target: number;
    wins: number;
  };
}

function getApiKey(): string {
  const key = process.env.RIOT_API_KEY;
  if (!key) {
    throw new Error("RIOT_API_KEY is not set");
  }
  return key;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Retry 429 with Retry-After (capped) a few times before surfacing. */
async function fetchWithRiot429Retry(
  doFetch: () => Promise<Response>,
  maxAttempts = 3,
): Promise<Response> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const res = await doFetch();
    if (res.status !== 429) return res;
    if (attempt === maxAttempts - 1) return res;
    const ra = res.headers.get("retry-after") ?? res.headers.get("Retry-After");
    const delaySec = ra
      ? Math.min(5, Math.max(0.5, Number.parseFloat(ra) || 1))
      : 1;
    await sleep(Math.round(delaySec * 1000));
  }
  throw new Error("Riot API: retry loop exhausted");
}

async function riotFetchPlatform<T>(
  platformId: string,
  path: string,
): Promise<T> {
  const base = RIOT_PLATFORM_BASE.replace("{platform}", platformId);
  const url = `${base}${path}`;
  const key = getApiKey();
  const res = await fetchWithRiot429Retry(() =>
    fetch(url, {
      headers: { "X-Riot-Token": key },
    }),
  );
  if (!res.ok) {
    if (res.status === 404) return null as T;
    throw new Error(`Riot API ${res.status}: ${res.statusText}`);
  }
  return res.json() as Promise<T>;
}

async function riotFetchRegion<T>(
  region: RiotRegion,
  path: string,
): Promise<T> {
  const base = RIOT_REGIONAL_BASE.replace("{region}", region);
  const url = `${base}${path}`;
  const key = getApiKey();
  const res = await fetchWithRiot429Retry(() =>
    fetch(url, {
      headers: { "X-Riot-Token": key },
    }),
  );
  if (!res.ok) {
    if (res.status === 404) return null as T;
    throw new Error(`Riot API ${res.status}: ${res.statusText}`);
  }
  return res.json() as Promise<T>;
}

/**
 * Run async work on items with at most `concurrency` in flight (order preserved).
 */
export async function mapWithConcurrency<T, R>(
  items: readonly T[],
  concurrency: number,
  mapper: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let nextIndex = 0;
  const limit = Math.max(1, Math.floor(concurrency));

  async function worker(): Promise<void> {
    while (true) {
      const i = nextIndex++;
      if (i >= items.length) return;
      results[i] = await mapper(items[i] as T, i);
    }
  }

  const workers = Array.from({ length: Math.min(limit, items.length) }, () =>
    worker(),
  );
  await Promise.all(workers);
  return results;
}

function rankCacheKey(
  gameName: string,
  tagLine: string,
  platformId: string,
): string {
  return `${gameName.trim().toLowerCase()}#${tagLine.trim().toLowerCase()}@${platformId.trim().toLowerCase()}`;
}

/**
 * Get Riot account by game name + tag line (Riot ID). Uses regional Account API.
 */
export function getAccountByRiotId(
  region: RiotRegion,
  gameName: string,
  tagLine: string,
): Promise<RiotAccount | null> {
  const encodedName = encodeURIComponent(gameName.trim());
  const encodedTag = encodeURIComponent(tagLine.trim());
  return riotFetchRegion<RiotAccount>(
    region,
    `/riot/account/v1/accounts/by-riot-id/${encodedName}/${encodedTag}`,
  );
}

/**
 * Get ranked entries by PUUID (platform-specific League API).
 */
export async function getRankedEntriesByPuuid(
  puuid: string,
  platformId: string,
): Promise<RiotLeagueEntry[]> {
  const entries = await riotFetchPlatform<RiotLeagueEntry[]>(
    platformId,
    `/lol/league/v4/entries/by-puuid/${encodeURIComponent(puuid)}`,
  );
  return entries ?? [];
}

async function fetchPlayerRankByRiotIdFromApi(
  gameName: string,
  tagLine: string,
  options?: {
    region?: RiotRegion;
    platformId?: string;
  },
): Promise<RiotLeagueEntry[]> {
  const platformId = options?.platformId ?? "eun1";
  const region = options?.region ?? platformIdToRegion(platformId);

  const account = await getAccountByRiotId(region, gameName, tagLine);
  if (!account) return [];

  return getRankedEntriesByPuuid(account.puuid, platformId);
}

/**
 * Get ranked entries for a player by Riot ID (gameName#tagLine).
 * 1. riot/account/v1/accounts/by-riot-id/{gameName}/{tagLine} → puuid
 * 2. lol/league/v4/entries/by-puuid/{puuid} → entries
 *
 * Short in-memory TTL cache to reduce duplicate Riot calls (same process).
 */
export async function getPlayerRankByRiotId(
  gameName: string,
  tagLine: string,
  options?: {
    region?: RiotRegion;
    platformId?: string;
  },
): Promise<RiotLeagueEntry[]> {
  const platformId = (options?.platformId ?? "eun1").trim().toLowerCase();
  const key = rankCacheKey(gameName, tagLine, platformId);
  const hit = rankCache.get(key);
  if (hit && Date.now() - hit.at < RANK_CACHE_TTL_MS) {
    return hit.data.slice();
  }
  const data = await fetchPlayerRankByRiotIdFromApi(gameName, tagLine, {
    ...options,
    platformId,
  });
  rankCache.set(key, { at: Date.now(), data: data.slice() });
  return data.slice();
}

/**
 * Get summoner by PUUID for the given platform (e.g. eun1, euw1).
 */
export function getSummonerByPuuid(
  puuid: string,
  platformId: string,
): Promise<RiotSummoner | null> {
  return riotFetchPlatform<RiotSummoner>(
    platformId,
    `/lol/summoner/v4/summoners/by-puuid/${encodeURIComponent(puuid)}`,
  );
}

/**
 * Get ranked entries for a summoner (by encrypted summoner id from summoner-v4).
 */
export async function getRankedEntriesBySummonerId(
  summonerId: string,
  platformId: string,
): Promise<RiotLeagueEntry[]> {
  const entries = await riotFetchPlatform<RiotLeagueEntry[]>(
    platformId,
    `/lol/league/v4/entries/by-summoner/${encodeURIComponent(summonerId)}`,
  );
  return entries ?? [];
}

export interface RiotPlayerProfile {
  summoner: RiotSummoner;
  rankedEntries: RiotLeagueEntry[];
}

/**
 * Get full profile: summoner + ranked entries. Returns null if summoner not found.
 */
export async function getPlayerProfile(
  puuid: string,
  platformId: string,
): Promise<RiotPlayerProfile | null> {
  const p = puuid?.trim();
  const platform = platformId?.trim();
  if (!p || !platform) return null;
  const summoner = await getSummonerByPuuid(p, platform);
  if (!summoner) return null;
  const rankedEntries = await getRankedEntriesBySummonerId(
    summoner.id,
    platform,
  );
  return { summoner, rankedEntries };
}
