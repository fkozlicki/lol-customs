"use client";

import { useSuspenseInfiniteQuery } from "@tanstack/react-query";
import { InfiniteScrollTrigger } from "@v1/ui/recipes/infinite-scroll-trigger";
import MatchCardSkeleton from "@v1/ui/recipes/matches/match-card-skeleton";
import MatchHistoryCard from "@v1/ui/recipes/matches/match-history-card";
import { useTranslations } from "next-intl";
import { useCallback, useMemo, useState } from "react";
import { DownloadAppButton } from "@/components/dashboard/download-app-button";
import { useSeasonParam } from "@/components/dashboard/use-season-param";
import { useTRPC } from "@/trpc/react";
import { toMatchCardView } from "./match-view";

export function MatchHistoryList({ season }: { season: number }) {
  const t = useTranslations("dashboard.pages.matchHistory");
  const trpc = useTRPC();
  const [expandedMatchId, setExpandedMatchId] = useState<number | null>(null);

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

  const toggleExpand = useCallback((matchId: number) => {
    setExpandedMatchId((prev) => (prev === matchId ? null : matchId));
  }, []);

  if (!matches.length) {
    return (
      <div className="flex flex-col items-start gap-4 py-10">
        <p className="text-sm text-muted-foreground">{t("noMatchesYet")}</p>
        <DownloadAppButton />
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {matches.map((match) => (
        <MatchHistoryCard
          key={match.id}
          match={match}
          expanded={expandedMatchId === match.id}
          onToggleExpand={() => toggleExpand(match.id)}
        />
      ))}
      <InfiniteScrollTrigger
        hasNextPage={hasNextPage}
        isFetchingNextPage={isFetchingNextPage}
        onLoadMore={fetchNextPage}
        loading={
          <div className="space-y-2">
            <MatchCardSkeleton />
            <MatchCardSkeleton />
            <MatchCardSkeleton />
          </div>
        }
      />
    </div>
  );
}
