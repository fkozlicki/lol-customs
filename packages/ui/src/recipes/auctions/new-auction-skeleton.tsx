import { Skeleton } from "../../components/skeleton";
import { PageHeaderSkeleton } from "../page-header";
import { PageShell } from "../page-shell";

/** The new-auction page while it loads: its header, then the pool, the ladder and the rules. */
export function NewAuctionSkeleton() {
  return (
    <PageShell>
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
    </PageShell>
  );
}
