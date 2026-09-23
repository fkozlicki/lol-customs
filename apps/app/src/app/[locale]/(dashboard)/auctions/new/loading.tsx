import { Skeleton } from "@v1/ui/skeleton";
import { PageHeaderSkeleton } from "@/components/page-header";

export default function NewAuctionLoading() {
  return (
    <div className="mx-auto w-full max-w-6xl space-y-10 px-4 pt-10 pb-16 sm:pt-16">
      <PageHeaderSkeleton eyebrow />
      <div className="space-y-12">
        {[0, 1, 2].map((step) => (
          <div key={step}>
            <div className="flex items-baseline gap-3 pb-4">
              <Skeleton className="h-4 w-6" />
              <Skeleton className="h-7 w-48" />
            </div>
            <div className="space-y-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
