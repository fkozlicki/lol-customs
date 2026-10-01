"use client";

import { useSuspenseQuery } from "@tanstack/react-query";
import { MostPlayedChampions as MostPlayedChampionsView } from "@v1/ui/recipes/player/most-played-champions";
import { useTRPC } from "@/trpc/react";
import { toChampionStatViews } from "./player-view";

interface MostPlayedChampionsProps {
  puuid: string;
  season: number;
}

export function MostPlayedChampions({
  puuid,
  season,
}: MostPlayedChampionsProps) {
  const trpc = useTRPC();
  const { data: champions } = useSuspenseQuery(
    trpc.players.mostPlayedChampions.queryOptions({ puuid, season, limit: 5 }),
  );

  return (
    <MostPlayedChampionsView champions={toChampionStatViews(champions ?? [])} />
  );
}
