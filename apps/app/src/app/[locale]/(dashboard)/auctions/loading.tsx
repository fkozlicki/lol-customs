import { AuctionListSkeleton } from "@/components/auctions/auction-list";
import { PageHeaderSkeleton } from "@/components/page-header";

export default function AuctionsLoading() {
  return (
    <div className="mx-auto w-full max-w-6xl space-y-10 px-4 pt-10 pb-16 sm:pt-16">
      <PageHeaderSkeleton />
      <AuctionListSkeleton />
    </div>
  );
}
