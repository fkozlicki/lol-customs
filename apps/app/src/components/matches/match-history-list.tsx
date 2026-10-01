"use client";

import { useSuspenseInfiniteQuery } from "@tanstack/react-query";
import { MatchList } from "@v1/ui/recipes/matches/match-list";
import { useMemo } from "react";
import { DownloadAppButton } from "@/components/dashboard/download-app-button";
import { useSeasonParam } from "@/components/dashboard/use-season-param";
import { useTRPC } from "@/trpc/react";
import { toMatchCardView } from "./match-view";

/** Every ladder match in the season, ten at a time. */
export function MatchHistoryList({ season }: { season: number }) {
  const trpc = useTRPC();
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useSuspenseInfiniteQuery(
      trpc.matches.list.infiniteQueryOptions(
        { season, limit: 10 },
        { getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined },
      ),
    );

  const seasonParam = useSeasonParam();
  const matches = useMemo(
    () =>
      data.pages
        .flatMap((p) => p.items)
        .map((match) => toMatchCardView(match, { season: seasonParam })),
    [data.pages, seasonParam],
  );

  return (
    <MatchList
      matches={matches}
      hasNextPage={hasNextPage}
      isFetchingNextPage={isFetchingNextPage}
      onLoadMore={fetchNextPage}
      emptyAction={<DownloadAppButton />}
    />
  );
}
