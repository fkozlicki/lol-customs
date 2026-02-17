/**
 * Simple fetch-based client for Riot API (account, summoner + ranked).
 * Server-only: uses RIOT_API_KEY from env (set by the app).
 */

const RIOT_PLATFORM_BASE = "https://{platform}.api.riotgames.com";
const RIOT_REGIONAL_BASE = "https://{region}.api.riotgames.com";

/** Account API (regional: europe, americas, asia, sea) */
export type RiotRegion = "europe" | "americas" | "asia" | "sea";

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

async function riotFetchPlatform<T>(
  platformId: string,
  path: string,
): Promise<T> {
  const base = RIOT_PLATFORM_BASE.replace("{platform}", platformId);
  const url = `${base}${path}`;
  const key = getApiKey();
  const res = await fetch(url, {
    headers: { "X-Riot-Token": key },
  });
  if (!res.ok) {
    if (res.status === 404) return null as T;
    throw new Error(`Riot API ${res.status}: ${res.statusText}`);
  }
  return res.json() as Promise<T>;
}

async function riotFetchRegion<T>(region: RiotRegion, path: string): Promise<T> {
  const base = RIOT_REGIONAL_BASE.replace("{region}", region);
  const url = `${base}${path}`;
  const key = getApiKey();
  const res = await fetch(url, {
    headers: { "X-Riot-Token": key },
  });
  if (!res.ok) {
    if (res.status === 404) return null as T;
    throw new Error(`Riot API ${res.status}: ${res.statusText}`);
  }
  return res.json() as Promise<T>;
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

/**
 * Get ranked entries for a player by Riot ID (gameName#tagLine).
 * 1. riot/account/v1/accounts/by-riot-id/{gameName}/{tagLine} → puuid
 * 2. lol/league/v4/entries/by-puuid/{puuid} → entries
 */
export async function getPlayerRankByRiotId(
  gameName: string,
  tagLine: string,
  options?: {
    region?: RiotRegion;
    platformId?: string;
  },
): Promise<RiotLeagueEntry[]> {
  const region = options?.region ?? "europe";
  const platformId = options?.platformId ?? "eun1";

  const account = await getAccountByRiotId(region, gameName, tagLine);
  if (!account) return [];

  return getRankedEntriesByPuuid(account.puuid, platformId);
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
