"use client";

import { useQueries, useQuery } from "@tanstack/react-query";
import { champion } from "@v1/game-assets/champions";
import type { Portrait } from "@v1/ui/recipes/backdrop/halftone-portraits";
import { useSeasonParam } from "@/components/dashboard/use-season-param";
import { useTRPC } from "@/trpc/react";
import { resolveSeason } from "@/utils/season";

/** How far down the standings the portraits go. */
const STANDINGS = 5;
/** Shown while a season has no standings yet: Jhin, Ahri, Yasuo, Thresh, Lee Sin. */
const FALLBACK = [202, 103, 157, 412, 64];

function portraitOf(key: number) {
  const found = champion(key);
  if (!found) return null;
  return { championId: found.dataDragonId, championName: found.name };
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
    const main = Number.isFinite(key) ? portraitOf(key) : null;
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
    const main = portraitOf(key);
    return main ? [{ ...main, playerName: null, position: null }] : [];
  });
}
