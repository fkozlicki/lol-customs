import { AuctionListSkeleton } from "@v1/ui/recipes/auctions/auction-list-skeleton";
import { PageHeaderSkeleton } from "@v1/ui/recipes/page-header";
import { PageShell } from "@v1/ui/recipes/page-shell";

export default function AuctionsLoading() {
  return (
    <PageShell>
      <PageHeaderSkeleton />
      <AuctionListSkeleton />
    </PageShell>
  );
}
