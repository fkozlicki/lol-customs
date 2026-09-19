import { Skeleton } from "@v1/ui/skeleton";
import MatchCardSkeleton from "@/components/matches/match-card-skeleton";

export default function PlayerProfileLoading() {
  return (
    <div className="mx-auto w-full max-w-6xl space-y-10 px-4 pt-10 pb-16 sm:pt-16">
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
    </div>
  );
}
