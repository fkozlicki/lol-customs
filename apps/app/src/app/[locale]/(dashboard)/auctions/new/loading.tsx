import { AuctionSetupSkeleton } from "@v1/ui/recipes/auctions/auction-setup-skeleton";
import { PageHeaderSkeleton } from "@v1/ui/recipes/page-header-skeleton";
import { PageShell } from "@v1/ui/recipes/page-shell";

export default function NewAuctionLoading() {
  return (
    <PageShell>
      <PageHeaderSkeleton eyebrow />
      <AuctionSetupSkeleton />
    </PageShell>
  );
}
