"use client";

import { type ReactNode, useState } from "react";
import { InfiniteScrollTrigger } from "../infinite-scroll-trigger";
import MatchCardSkeleton from "./match-card-skeleton";
import MatchHistoryCard from "./match-history-card";
import { MatchListEmpty } from "./match-list-empty";
import type { MatchCardView } from "./match-view";

interface MatchListProps {
  matches: MatchCardView[];
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  onLoadMore: () => void;
  /** Offered when the list is empty, e.g. the desktop app that records matches. */
  emptyAction?: ReactNode;
}

/** Matches newest first, one open at a time for its scoreboard, loading more on scroll. */
export function MatchList({
  matches,
  hasNextPage,
  isFetchingNextPage,
  onLoadMore,
  emptyAction,
}: MatchListProps) {
  const [expandedId, setExpandedId] = useState<number | null>(null);

  if (matches.length === 0) return <MatchListEmpty action={emptyAction} />;

  return (
    <div className="space-y-2">
      {matches.map((match) => (
        <MatchHistoryCard
          key={match.id}
          match={match}
          expanded={expandedId === match.id}
          onToggleExpand={() =>
            setExpandedId((open) => (open === match.id ? null : match.id))
          }
        />
      ))}
      <InfiniteScrollTrigger
        hasNextPage={hasNextPage}
        isFetchingNextPage={isFetchingNextPage}
        onLoadMore={onLoadMore}
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
