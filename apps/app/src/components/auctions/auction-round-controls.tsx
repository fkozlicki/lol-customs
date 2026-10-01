"use client";

import { BidControls } from "@v1/ui/recipes/auctions/bid-controls";
import { FreeAuctionControls } from "@v1/ui/recipes/auctions/free-auction-controls";
import { type AuctionRoomSnapshot, captainFor } from "./auction-contract";
import type { useAuctionRoomActions } from "./use-auction-room-actions";

interface AuctionRoundControlsProps {
  room: AuctionRoomSnapshot;
  actions: ReturnType<typeof useAuctionRoomActions>;
}

/** The viewer's controls for the round on stage: bidding, or the free auction's take-or-pass. */
export function AuctionRoundControls({
  room,
  actions,
}: AuctionRoundControlsProps) {
  const { mySide, canBid, canConcede, canDecideFreeAuction } = room.permissions;

  if (room.phase === "free_auction") {
    return (
      <FreeAuctionControls
        canDecide={canDecideFreeAuction}
        busy={actions.bidding}
        onTake={actions.take}
        onPass={actions.pass}
      />
    );
  }

  return (
    <BidControls
      key={room.currentPlayerId}
      minimumBid={(room.currentBid ?? 0) + 1}
      budget={mySide ? (captainFor(room, mySide)?.budgetRemaining ?? 0) : 0}
      canBid={canBid}
      canConcede={canConcede}
      busy={actions.bidding}
      onBid={actions.bid}
      onConcede={actions.concede}
    />
  );
}
