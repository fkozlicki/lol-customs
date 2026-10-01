import { Skeleton } from "../../components/skeleton";
import MatchCardSkeleton from "../matches/match-card-skeleton";

/** A profile while it loads: the header, the stats and chart, then the side panel and matches. The page puts it in `PageShell`. */
export function PlayerProfileSkeleton() {
  return (
    <div className="space-y-10">
      <div className="flex items-center gap-6">
        <Skeleton className="size-16 sm:size-24" />
        <Skeleton className="h-10 w-64" />
      </div>
      <Skeleton className="h-56 w-full" />
      <Skeleton className="h-56 w-full" />
      <div className="grid gap-10 lg:grid-cols-[18rem_minmax(0,1fr)]">
        <Skeleton className="h-80 w-full" />
        <div className="space-y-2">
          {Array.from({ length: 6 }, (_, i) => (
            <MatchCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}
