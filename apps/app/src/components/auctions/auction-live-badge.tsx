"use client";

import { ConnectionBadge } from "@v1/ui/recipes/auctions/connection-badge";
import { useAuctionLive } from "./auction-live";

/** How the page around it keeps up with the auctions, from the nearest `AuctionLive`. */
export function AuctionLiveBadge() {
  const { connection } = useAuctionLive();
  return <ConnectionBadge state={connection} />;
}
