import { Skeleton } from "@v1/ui/skeleton";

export default function LeaderboardSkeleton() {
  return (
    <div className="space-y-12 sm:space-y-16">
      <div className="space-y-8 sm:space-y-12">
        <div className="space-y-3">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-16 w-3/4 sm:h-32" />
        </div>
        <div className="grid grid-cols-3 items-end gap-2 sm:gap-4">
          <Skeleton className="h-48 sm:h-72" />
          <Skeleton className="h-56 sm:h-80" />
          <Skeleton className="h-40 sm:h-64" />
        </div>
      </div>
      <div className="space-y-px">
        {Array.from({ length: 10 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full" />
        ))}
      </div>
    </div>
  );
}
