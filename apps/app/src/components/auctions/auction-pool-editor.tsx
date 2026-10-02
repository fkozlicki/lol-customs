"use client";

import { AuctionSetupSkeleton } from "@v1/ui/recipes/auctions/auction-setup-skeleton";
import { QueryBoundary } from "@/components/query-boundary";
import type { AuctionRoomSnapshot } from "./auction-contract";
import { useAuctionLive } from "./auction-live";
import { AuctionSetupForm } from "./auction-setup-form";

/** The lobby's pool and rules, open for the creator to change; it reads the ladder when it opens. */
export function AuctionPoolEditor({
  room,
  onClose,
}: {
  room: AuctionRoomSnapshot;
  onClose: () => void;
}) {
  const { refresh } = useAuctionLive();

  return (
    <QueryBoundary fallback={<AuctionSetupSkeleton />}>
      <AuctionSetupForm
        roomId={room.id}
        initialPlayers={room.players.map((player) => ({
          gameName: player.gameName,
          tagLine: player.tagLine,
          rankTier: player.soloTier,
          rankDivision: player.soloDivision,
        }))}
        initialBudget={room.budget}
        initialBidSeconds={room.bidSeconds}
        initialRevealOrder={room.showOrder}
        onUpdated={() => {
          onClose();
          refresh();
        }}
        onCancel={onClose}
      />
    </QueryBoundary>
  );
}
