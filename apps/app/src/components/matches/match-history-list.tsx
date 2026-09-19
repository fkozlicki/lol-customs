"use client";

import { useSuspenseInfiniteQuery } from "@tanstack/react-query";
import type { RouterOutputs } from "@v1/api";
import { useCallback, useState } from "react";
import { DownloadAppButton } from "@/components/dashboard/download-app-button";
import { InfiniteScrollTrigger } from "@/components/infinite-scroll-trigger";
import { useScopedI18n } from "@/locales/client";
import { useTRPC } from "@/trpc/react";
import MatchHistoryCard from "./match-history-card";

export type Match = RouterOutputs["matches"]["list"]["items"][number];
export type MatchParticipant = Match["match_participants"][number];

export interface RawParticipant {
  stats: {
    item0: number;
    item1: number;
    item2: number;
    item3: number;
    item4: number;
    item5: number;
    item6: number;
    perk0: number;
    perk1: number;
    perk2: number;
    perk3: number;
    perk4: number;
    perk5: number;
    perkPrimaryStyle?: number;
  };
  participantId: number;
  spell1Id: number;
  spell2Id: number;
}

export interface RawJson {
  participants: RawParticipant[];
}

export function MatchHistoryList({ season }: { season: number }) {
  const t = useScopedI18n("dashboard.pages.matchHistory");
  const trpc = useTRPC();
  const [expandedMatchId, setExpandedMatchId] = useState<number | null>(null);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useSuspenseInfiniteQuery(
      trpc.matches.list.infiniteQueryOptions(
        { season, limit: 10 },
        { getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined },
      ),
    );

  const matches = data.pages.flatMap((p) => p.items);

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
          key={match.match_id}
          match={match}
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
