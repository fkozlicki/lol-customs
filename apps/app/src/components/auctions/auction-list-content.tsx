"use client";

import { useSuspenseQuery } from "@tanstack/react-query";
import { AuctionSummaryList } from "@v1/ui/recipes/auctions/auction-summary-list";
import { useTRPC } from "@/trpc/react";
import { toAuctionSummaryView } from "./auction-list-view";
import { CreateAuctionButton } from "./create-auction-button";

/** Every lobby and live auction, kept current by the page's `AuctionLive`. */
export function AuctionListContent() {
  const trpc = useTRPC();
  const { data } = useSuspenseQuery(trpc.auctions.listActive.queryOptions());

  return (
    <AuctionSummaryList
      auctions={data.map(toAuctionSummaryView)}
      emptyAction={<CreateAuctionButton variant="outline" />}
    />
  );
}
