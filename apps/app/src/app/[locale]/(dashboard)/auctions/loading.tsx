import { AuctionListSkeleton } from "@/components/auctions/auction-list";

export default function AuctionsLoading() {
  return (
    <div className="mx-auto w-full max-w-6xl p-4 sm:p-6">
      <AuctionListSkeleton />
    </div>
  );
}
