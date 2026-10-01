import { AuctionRoomSkeleton } from "@v1/ui/recipes/auctions/auction-room-skeleton";
import { PageShell } from "@v1/ui/recipes/page-shell";

export default function AuctionRoomLoading() {
  return (
    <PageShell>
      <AuctionRoomSkeleton />
    </PageShell>
  );
}
