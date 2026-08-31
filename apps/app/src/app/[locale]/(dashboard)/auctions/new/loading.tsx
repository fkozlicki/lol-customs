import { Skeleton } from "@v1/ui/skeleton";

export default function NewAuctionLoading() {
  return (
    <div className="mx-auto grid max-w-6xl gap-5 p-4 sm:p-6 lg:grid-cols-[1.35fr_.65fr]">
      <Skeleton className="h-[620px] rounded-xl" />
      <Skeleton className="h-[620px] rounded-xl" />
    </div>
  );
}
