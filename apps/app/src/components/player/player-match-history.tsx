"use client";

import { useSuspenseInfiniteQuery } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import { InfiniteScrollTrigger } from "@/components/infinite-scroll-trigger";
import MatchHistoryCard from "@/components/matches/match-history-card";
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

  const matches = data.pages.flatMap((p) => p.items);

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
          key={match.match_id}
          match={match}
          expandedMatchId={expandedMatchId}
          toggleExpand={toggleExpand}
          puuid={puuid}
        />
      ))}
      <InfiniteScrollTrigger
        hasNextPage={hasNextPage}
        isFetchingNextPage={isFetchingNextPage}
        onLoadMore={fetchNextPage}
      />
    </div>
  );
}
