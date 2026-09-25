"use client";

import { useQueries, useQuery } from "@tanstack/react-query";
import { useSeasonParam } from "@/components/dashboard/use-season-param";
import { CHAMPIONS } from "@/game-data/champions";
import { useTRPC } from "@/trpc/react";
import { resolveSeason } from "@/utils/season";

export interface Portrait {
  /** Data Dragon id: the square image's name without `.png`. */
  championId: string;
  championName: string;
  playerName: string | null;
  /** Place in the standings; null for a player not yet qualified. */
  position: number | null;
}

/** How far down the standings the portraits go. */
const STANDINGS = 5;
/** Shown while a season has no standings yet: Jhin, Ahri, Yasuo, Thresh, Lee Sin. */
const FALLBACK = [202, 103, 157, 412, 64];

function champion(key: number) {
  const found = CHAMPIONS[key];
  if (!found) return null;
  return {
    championId: found.image.replace(/\.png$/, ""),
    championName: found.name,
  };
}

/**
 * The champion each of the top five plays most in the season on screen, one portrait per champion
 * (a main shared by two players is shown once, for the higher). Null while loading, and while not
 * `enabled`, which fetches nothing.
 */
export function useStandingsPortraits({
  enabled,
}: {
  enabled: boolean;
}): Portrait[] | null {
  const trpc = useTRPC();
  const raw = useSeasonParam();
  const { data: seasons } = useQuery(trpc.seasons.list.queryOptions());
  const season = seasons ? resolveSeason(raw, seasons) : undefined;

  const { data: standings, isFetched } = useQuery({
    ...trpc.riftRank.leaderboard.queryOptions({
      season: season ?? 0,
      limit: STANDINGS,
    }),
    enabled: enabled && season !== undefined,
  });

  const mains = useQueries({
    queries: (standings ?? []).map((row) => ({
      ...trpc.players.mostPlayedChampions.queryOptions({
        puuid: row.puuid,
        season: season ?? 0,
        limit: 1,
      }),
      enabled,
    })),
  });

  if (!isFetched || mains.some((query) => !query.isFetched)) return null;

  const portraits: Portrait[] = [];
  const seen = new Set<string>();
  (standings ?? []).forEach((row, i) => {
    const key = Number(mains[i]?.data?.[0]?.championId);
    const main = Number.isFinite(key) ? champion(key) : null;
    if (!main || seen.has(main.championId)) return;
    seen.add(main.championId);
    portraits.push({
      ...main,
      playerName: row.player.game_name,
      position: row.position,
    });
  });
  if (portraits.length > 0) return portraits;

  return FALLBACK.flatMap((key) => {
    const main = champion(key);
    return main ? [{ ...main, playerName: null, position: null }] : [];
  });
}
