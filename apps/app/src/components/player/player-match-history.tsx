"use client";

import { useSuspenseInfiniteQuery } from "@tanstack/react-query";
import { MatchList } from "@v1/ui/recipes/matches/match-list";
import { useMemo } from "react";
import { useSeasonParam } from "@/components/dashboard/use-season-param";
import { toMatchCardView } from "@/components/matches/match-view";
import { useTRPC } from "@/trpc/react";

interface PlayerMatchHistoryProps {
  puuid: string;
  season: number;
}

/** The player's matches in the season, ten at a time, seen from their side. */
export function PlayerMatchHistory({ puuid, season }: PlayerMatchHistoryProps) {
  const trpc = useTRPC();
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useSuspenseInfiniteQuery(
      trpc.matches.listByPuuid.infiniteQueryOptions(
        { puuid, season, limit: 10 },
        { getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined },
      ),
    );

  const seasonParam = useSeasonParam();
  const matches = useMemo(
    () =>
      data.pages
        .flatMap((p) => p.items)
        .map((match) => toMatchCardView(match, { puuid, season: seasonParam })),
    [data.pages, puuid, seasonParam],
  );

  return (
    <MatchList
      matches={matches}
      hasNextPage={hasNextPage}
      isFetchingNextPage={isFetchingNextPage}
      onLoadMore={fetchNextPage}
    />
  );
}
