"use client";

import {
  useSuspenseInfiniteQuery,
  useSuspenseQuery,
} from "@tanstack/react-query";
import type { RouterOutputs } from "@v1/api";
import { Card, CardContent, CardHeader, CardTitle } from "@v1/ui/card";
import { useCallback, useState } from "react";
import { InfiniteScrollTrigger } from "@/components/infinite-scroll-trigger";
import { useScopedI18n } from "@/locales/client";
import { useTRPC } from "@/trpc/react";
import MatchHistoryCard from "./match-history-card";

export type Match = RouterOutputs["matches"]["list"]["items"][number];
export type MatchParticipant = Match["match_participants"][number];
export interface ChampionMap {
  [key: string]: { id: string; key: string; name: string; imageFull: string };
}

export function MatchHistoryList() {
  const t = useScopedI18n("dashboard.pages.matchHistory");
  const trpc = useTRPC();
  const [expandedMatchId, setExpandedMatchId] = useState<number | null>(null);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useSuspenseInfiniteQuery(
      trpc.matches.list.infiniteQueryOptions(
        { limit: 10 },
        { getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined },
      ),
    );
  const { data: patch } = useSuspenseQuery(
    trpc.datadragon.currentPatch.queryOptions(),
  );
  const { data: championMap } = useSuspenseQuery(
    trpc.datadragon.championMap.queryOptions(),
  );

  const matches = data.pages.flatMap((p) => p.items);

  const toggleExpand = useCallback((matchId: number) => {
    setExpandedMatchId((prev) => (prev === matchId ? null : matchId));
  }, []);

  if (!matches.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t("emptyTitle")}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">{t("noMatchesYet")}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {matches.map((match) => (
        <MatchHistoryCard
          key={match.match_id}
          match={match}
          patch={patch ?? ""}
          championMap={championMap ?? {}}
          expandedMatchId={expandedMatchId}
          toggleExpand={toggleExpand}
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
