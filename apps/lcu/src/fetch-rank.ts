/**
 * Fetch rank (tier + division) via Riot API for a participant.
 * 1. riot/account/v1/accounts/by-riot-id/{gameName}/{tagLine} → puuid
 * 2. lol/league/v4/entries/by-puuid/{puuid} → entries (use RANKED_SOLO_5x5)
 */

import fs from "node:fs";
import path from "node:path";

const RANKED_SOLO_QUEUE_TYPE = "RANKED_SOLO_5x5";

type RiotRegion = "europe" | "americas" | "asia" | "sea";

interface RiotAccount {
  puuid: string;
  gameName: string;
  tagLine: string;
}

interface RiotLeagueEntry {
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
}

function getApiKey(): string {
  let key = process.env.RIOT_API_KEY;
  if (!key) {
    const configPath = path.join(__dirname, "supabase-config.json");
    if (fs.existsSync(configPath)) {
      try {
        const data = JSON.parse(
          fs.readFileSync(configPath, "utf8"),
        ) as { RIOT_API_KEY?: string };
        key = data.RIOT_API_KEY;
      } catch {
        // ignore
      }
    }
  }
  if (!key) {
    throw new Error(
      "RIOT_API_KEY is not set (e.g. in .env for dev, or embed-config for production).",
    );
  }
  return key;
}

/** Map platform id (e.g. EUN1, NA1) to Riot region and platform. */
function platformToRegionAndPlatform(
  platformId: string,
): { region: RiotRegion; platform: string } {
  const upper = (platformId ?? "").toUpperCase();
  const platform = (platformId ?? "").toLowerCase();
  if (["EUN1", "EUW1", "TR1", "RU"].some((p) => upper.startsWith(p))) {
    return { region: "europe", platform };
  }
  if (["NA1", "BR1", "LA1", "LA2"].some((p) => upper.startsWith(p))) {
    return { region: "americas", platform };
  }
  if (["KR", "JP1"].some((p) => upper.startsWith(p))) {
    return { region: "asia", platform };
  }
  if (["OC1", "PH2", "SG2", "TH2", "TW2", "VN2"].some((p) => upper.startsWith(p))) {
    return { region: "sea", platform };
  }
  return { region: "europe", platform };
}

async function riotFetchRegion<T>(
  region: RiotRegion,
  path: string,
): Promise<T | null> {
  const url = `https://${region}.api.riotgames.com${path}`;
  const res = await fetch(url, {
    headers: { "X-Riot-Token": getApiKey() },
  });
  if (!res.ok) {
    if (res.status === 404) return null;
    throw new Error(`Riot API ${res.status}: ${res.statusText}`);
  }
  return res.json() as Promise<T>;
}

async function riotFetchPlatform<T>(
  platform: string,
  path: string,
): Promise<T | null> {
  const url = `https://${platform}.api.riotgames.com${path}`;
  const res = await fetch(url, {
    headers: { "X-Riot-Token": getApiKey() },
  });
  if (!res.ok) {
    if (res.status === 404) return null;
    throw new Error(`Riot API ${res.status}: ${res.statusText}`);
  }
  return res.json() as Promise<T>;
}

/**
 * Fetch rank (tier + division) for a participant by Riot ID (gameName#tagLine).
 * Uses Riot Account API then League API; returns Solo/Duo tier and division if present.
 */
export async function fetchRankForParticipant(
  gameName: string,
  tagLine: string,
  platformId: string,
): Promise<{ rank_tier: string; rank_division: string } | null> {
  try {
    const { region, platform } = platformToRegionAndPlatform(platformId);
    const encodedName = encodeURIComponent(gameName.trim());
    const encodedTag = encodeURIComponent(tagLine.trim());

    const account = await riotFetchRegion<RiotAccount>(
      region,
      `/riot/account/v1/accounts/by-riot-id/${encodedName}/${encodedTag}`,
    );
    if (!account?.puuid) return null;

    const entries = await riotFetchPlatform<RiotLeagueEntry[]>(
      platform,
      `/lol/league/v4/entries/by-puuid/${encodeURIComponent(account.puuid)}`,
    );
    if (!Array.isArray(entries) || entries.length === 0) return null;

    const solo = entries.find((e) => e.queueType === RANKED_SOLO_QUEUE_TYPE);
    if (solo?.tier == null || solo?.rank == null) return null;

    return {
      rank_tier: String(solo.tier),
      rank_division: String(solo.rank),
    };
  } catch (err) {
    console.warn(
      `Rank fetch failed for ${gameName}#${tagLine}:`,
      err instanceof Error ? err.message : err,
    );
    return null;
  }
}
