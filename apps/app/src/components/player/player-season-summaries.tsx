"use client";

import { useSuspenseQuery } from "@tanstack/react-query";
import { PlayerSeasonSummaries as PlayerSeasonSummariesView } from "@v1/ui/recipes/player/player-season-summaries";
import { useTRPC } from "@/trpc/react";
import type { SeasonOption } from "@/utils/season";
import { toSeasonSummaryViews } from "./player-view";

interface PlayerSeasonSummariesProps {
  puuid: string;
  season: number;
  seasons: SeasonOption[];
}

export function PlayerSeasonSummaries({
  puuid,
  season,
  seasons,
}: PlayerSeasonSummariesProps) {
  const trpc = useTRPC();
  const { data: summaries } = useSuspenseQuery(
    trpc.players.seasonSummaries.queryOptions({ puuid }),
  );

  return (
    <PlayerSeasonSummariesView
      summaries={toSeasonSummaryViews(summaries, { seasons, active: season })}
    />
  );
}
