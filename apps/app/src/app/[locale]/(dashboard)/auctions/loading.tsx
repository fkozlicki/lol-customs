import { PageHeaderSkeleton } from "@v1/ui/recipes/page-header";
import { PageShell } from "@v1/ui/recipes/page-shell";
import { AuctionListSkeleton } from "@/components/auctions/auction-list";

export default function AuctionsLoading() {
  return (
    <PageShell>
      <PageHeaderSkeleton />
      <AuctionListSkeleton />
    </PageShell>
  );
}
