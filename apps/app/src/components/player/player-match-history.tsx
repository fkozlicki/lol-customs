"use client";

import { useSuspenseInfiniteQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@v1/ui/card";
import { useCallback, useState } from "react";
import { InfiniteScrollTrigger } from "@/components/infinite-scroll-trigger";
import MatchHistoryCard from "@/components/matches/match-history-card";
import { useTRPC } from "@/trpc/react";

interface PlayerMatchHistoryProps {
  puuid: string;
}

export function PlayerMatchHistory({ puuid }: PlayerMatchHistoryProps) {
  const trpc = useTRPC();
  const [expandedMatchId, setExpandedMatchId] = useState<number | null>(null);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useSuspenseInfiniteQuery(
      trpc.matches.listByPuuid.infiniteQueryOptions(
        { puuid, limit: 10 },
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
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Match History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No matches found.</p>
        </CardContent>
      </Card>
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
