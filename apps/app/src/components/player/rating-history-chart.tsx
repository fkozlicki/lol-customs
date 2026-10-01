"use client";

import { useSuspenseQuery } from "@tanstack/react-query";
import { RatingHistoryChart as RatingHistoryChartView } from "@v1/ui/recipes/player/rating-history-chart";
import { useTRPC } from "@/trpc/react";
import { toRatingPoints, toSeasonMarkers } from "./player-view";

interface RatingHistoryChartProps {
  puuid: string;
  season: number;
  /** Season start markers drawn on the all-time chart. */
  seasonStarts?: { number: number; startsAt: string }[];
}

export function RatingHistoryChart({
  puuid,
  season,
  seasonStarts = [],
}: RatingHistoryChartProps) {
  const trpc = useTRPC();
  const { data: history } = useSuspenseQuery(
    trpc.players.ratingHistory.queryOptions({ puuid, season }),
  );

  return (
    <RatingHistoryChartView
      points={toRatingPoints(history ?? [])}
      seasonMarkers={toSeasonMarkers(history ?? [], seasonStarts)}
    />
  );
}
