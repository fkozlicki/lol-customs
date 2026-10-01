import { Skeleton } from "../../components/skeleton";

/** The auction setup while it loads: the pool, the ladder and the rules. */
export function AuctionSetupSkeleton() {
  return (
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
  );
}
