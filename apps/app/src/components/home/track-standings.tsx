"use client";

import { useSuspenseQuery } from "@tanstack/react-query";
import { QUALIFICATION_MATCHES } from "@v1/api/season";
import { Standings } from "@v1/ui/recipes/home/standings";
import { useMemo } from "react";
import { DownloadAppButton } from "@/components/dashboard/download-app-button";
import { useSeasonParam } from "@/components/dashboard/use-season-param";
import { useTRPC } from "@/trpc/react";
import { toStandingsRowView } from "./standings-view";

interface TrackStandingsProps {
  season: number;
  seasonTitle: string;
  limit?: number;
  /** Replay the standings as they stood after this many matches (`replayPoint`); undefined is live. */
  after?: number;
  historyPicker?: React.ReactNode;
}

/** The season's standings, live or replayed, as the home page shows them. */
export function TrackStandings({
  season,
  seasonTitle,
  limit = 50,
  after,
  historyPicker,
}: TrackStandingsProps) {
  const trpc = useTRPC();
  const seasonParam = useSeasonParam();
  const { data: standings } = useSuspenseQuery(
    trpc.standings.get.queryOptions({
      season,
      limit,
      afterMatches: after,
    }),
  );

  const rows = useMemo(
    () =>
      standings.map((row) => toStandingsRowView(row, { season: seasonParam })),
    [standings, seasonParam],
  );

  return (
    <Standings
      seasonTitle={seasonTitle}
      rows={rows}
      qualificationMatches={QUALIFICATION_MATCHES}
      historyPicker={historyPicker}
      emptyAction={<DownloadAppButton />}
    />
  );
}
