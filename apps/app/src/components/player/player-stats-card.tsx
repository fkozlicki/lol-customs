"use client";

import { useSuspenseQuery } from "@tanstack/react-query";
import { QUALIFICATION_MATCHES } from "@v1/api/season";
import { PlayerStats } from "@v1/ui/recipes/player/player-stats";
import { useSeasonParam } from "@/components/dashboard/use-season-param";
import { toStandingsRowView } from "@/components/home/standings-view";
import { useTRPC } from "@/trpc/react";

interface PlayerStatsCardProps {
  puuid: string;
  season: number;
}

/** The player's line on the selected rating track, drawn as the profile's stat grid. */
export function PlayerStatsCard({ puuid, season }: PlayerStatsCardProps) {
  const trpc = useTRPC();
  const seasonParam = useSeasonParam();
  const { data: stats } = useSuspenseQuery(
    trpc.players.profileStats.queryOptions({ puuid, season }),
  );

  if (!stats) return null;

  return (
    <PlayerStats
      stats={toStandingsRowView(stats, { season: seasonParam })}
      qualificationMatches={QUALIFICATION_MATCHES}
    />
  );
}
