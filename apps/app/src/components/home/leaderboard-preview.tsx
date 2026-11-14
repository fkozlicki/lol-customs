"use client";

import { useSuspenseQuery } from "@tanstack/react-query";
import { QUALIFICATION_MATCHES } from "@v1/api/season";
import { Standings } from "@v1/ui/recipes/home/standings";
import { useMemo } from "react";
import { DownloadAppButton } from "@/components/dashboard/download-app-button";
import { useSeasonParam } from "@/components/dashboard/use-season-param";
import { useTRPC } from "@/trpc/react";
import { maxHistoricallyAfterMatches } from "./standings-after-matches";
import { toStandingsRowView } from "./standings-view";

interface LeaderboardProps {
  season: number;
  seasonTitle: string;
  limit?: number;
  /** Replay the standings as they stood after this many matches. */
  after?: number;
  historyPicker?: React.ReactNode;
}

/** A requested replay point, clamped to the matches played; anything else means live. */
function parseAfterMatches(
  totalMatches: number,
  value: number | undefined,
): number | undefined {
  if (value == null) return undefined;
  const maxAfter = maxHistoricallyAfterMatches(totalMatches);
  if (!Number.isInteger(value) || value < 1 || maxAfter < 1) return undefined;
  return Math.min(value, maxAfter);
}

/** The season's standings, live or replayed, as the home page shows them. */
export function Leaderboard({
  season,
  seasonTitle,
  limit = 50,
  after,
  historyPicker,
}: LeaderboardProps) {
  const trpc = useTRPC();
  const seasonParam = useSeasonParam();
  const { data: matchCount = 0 } = useSuspenseQuery(
    trpc.matches.count.queryOptions({ season }),
  );
  const { data: leaderboard } = useSuspenseQuery(
    trpc.standings.get.queryOptions({
      season,
      limit,
      afterMatches: parseAfterMatches(matchCount, after),
    }),
  );

  const rows = useMemo(
    () =>
      leaderboard.map((row) =>
        toStandingsRowView(row, { season: seasonParam }),
      ),
    [leaderboard, seasonParam],
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
