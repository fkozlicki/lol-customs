import { Skeleton } from "../../components/skeleton";
import { PageShell } from "../page-shell";

/** Matches an auction room while it loads: the header, then the two rosters around the stage. */
export function AuctionRoomSkeleton() {
  return (
    <PageShell>
      <div className="border-b pb-4">
        <div className="flex items-center gap-4">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3 w-20" />
        </div>
        <Skeleton className="mt-2 h-8 w-2/3 sm:h-10" />
      </div>

      <div className="grid gap-10 lg:grid-cols-[minmax(260px,320px)_minmax(0,1fr)_minmax(260px,320px)] lg:gap-12">
        <Skeleton className="order-2 h-80 lg:order-1" />
        <div className="order-1 space-y-8 lg:order-2">
          <div className="space-y-4">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-12 w-2/3" />
            <Skeleton className="h-28 w-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-4 w-full" />
          </div>
        </div>
        <Skeleton className="order-3 h-80" />
      </div>
    </PageShell>
  );
}
