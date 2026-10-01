"use client";

import { AuctionListError } from "@v1/ui/recipes/auctions/auction-list-error";
import { AuctionListSkeleton } from "@v1/ui/recipes/auctions/auction-list-skeleton";
import { QueryBoundary } from "@/components/query-boundary";
import { AuctionListContent } from "./auction-list-content";

/** The list of auctions, with its own skeleton and its own way back when it cannot be read. */
export function AuctionList() {
  return (
    <QueryBoundary
      fallback={<AuctionListSkeleton />}
      errorFallback={(retry) => <AuctionListError onRetry={retry} />}
    >
      <AuctionListContent />
    </QueryBoundary>
  );
}
