"use client";

import { useSuspenseInfiniteQuery } from "@tanstack/react-query";
import { InfiniteScrollTrigger } from "@v1/ui/recipes/infinite-scroll-trigger";
import MatchCardSkeleton from "@v1/ui/recipes/matches/match-card-skeleton";
import MatchHistoryCard from "@v1/ui/recipes/matches/match-history-card";
import { useCallback, useMemo, useState } from "react";
import { useSeasonParam } from "@/components/dashboard/use-season-param";
import { toMatchCardView } from "@/components/matches/match-view";
import { useScopedI18n } from "@/locales/client";
import { useTRPC } from "@/trpc/react";

interface PlayerMatchHistoryProps {
  puuid: string;
  season: number;
}

export function PlayerMatchHistory({ puuid, season }: PlayerMatchHistoryProps) {
  const t = useScopedI18n("dashboard.pages.matchHistory");
  const trpc = useTRPC();
  const [expandedMatchId, setExpandedMatchId] = useState<number | null>(null);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useSuspenseInfiniteQuery(
      trpc.matches.listByPuuid.infiniteQueryOptions(
        { puuid, season, limit: 10 },
        {
          getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
        },
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

  const toggleExpand = useCallback((matchId: number) => {
    setExpandedMatchId((prev) => (prev === matchId ? null : matchId));
  }, []);

  if (!matches.length) {
    return (
      <p className="py-10 text-sm text-muted-foreground">{t("noMatchesYet")}</p>
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
