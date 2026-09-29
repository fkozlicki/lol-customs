import MatchCardSkeleton from "@v1/ui/recipes/matches/match-card-skeleton";
import { PageShell } from "@v1/ui/recipes/page-shell";
import { Skeleton } from "@v1/ui/skeleton";

export default function PlayerProfileLoading() {
  return (
    <PageShell>
      <div className="flex items-center gap-6">
        <Skeleton className="size-16 sm:size-24" />
        <Skeleton className="h-10 w-64" />
      </div>
      <Skeleton className="h-56 w-full" />
      <Skeleton className="h-56 w-full" />
      <div className="grid gap-10 lg:grid-cols-[18rem_minmax(0,1fr)]">
        <Skeleton className="h-80 w-full" />
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <MatchCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </PageShell>
  );
}
