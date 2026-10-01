import { Skeleton } from "../../components/skeleton";

/** Matches the auction list while it loads: two rooms, each a status line, a title and the price. */
export function AuctionListSkeleton() {
  return (
    <div className="space-y-12">
      {[0, 1].map((item) => (
        <div key={item}>
          <div className="flex items-center gap-3 pb-4">
            <Skeleton className="size-1.5" />
            <Skeleton className="h-3 w-20" />
          </div>
          <div className="grid gap-6 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
            <div className="space-y-2">
              <Skeleton className="h-8 w-3/4 sm:h-12" />
              <Skeleton className="h-3 w-56" />
            </div>
            <div className="flex items-end gap-8 sm:justify-end">
              <div className="space-y-2">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-5 w-24" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-3 w-12" />
                <Skeleton className="h-9 w-20" />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
