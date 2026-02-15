/**
 * Simple fetch-based client for Riot API (summoner + ranked).
 * Server-only: uses RIOT_API_KEY from env (set by the app).
 */

const RIOT_BASE = "https://{platform}.api.riotgames.com";

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

async function riotFetch<T>(platformId: string, path: string): Promise<T> {
  const base = RIOT_BASE.replace("{platform}", platformId);
  const url = `${base}${path}`;
  const key = getApiKey();
  const res = await fetch(url, {
    headers: {
      "X-Riot-Token": key,
    },
  });
  if (!res.ok) {
    if (res.status === 404) return null as T;
    throw new Error(`Riot API ${res.status}: ${res.statusText}`);
  }
  return res.json() as Promise<T>;
}

/**
 * Get summoner by PUUID for the given platform (e.g. eun1, euw1).
 */
export function getSummonerByPuuid(
  puuid: string,
  platformId: string,
): Promise<RiotSummoner | null> {
  return riotFetch<RiotSummoner>(
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
  return riotFetch<RiotLeagueEntry[]>(
    platformId,
    `/lol/league/v4/entries/by-summoner/${encodeURIComponent(summonerId)}`,
  ).then((entries) => entries ?? []);
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
