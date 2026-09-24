import { AuctionListSkeleton } from "@/components/auctions/auction-list";
import { PageHeaderSkeleton } from "@/components/page-header";
import { PageShell } from "@/components/page-shell";

export default function AuctionsLoading() {
  return (
    <PageShell>
      <PageHeaderSkeleton />
      <AuctionListSkeleton />
    </PageShell>
  );
}
