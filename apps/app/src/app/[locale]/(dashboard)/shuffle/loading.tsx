import { Skeleton } from "@v1/ui/skeleton";
import { RandomTeamsToolSkeleton } from "@/components/random-teams/random-teams-tool";

export default function ShuffleLoading() {
  return (
    <div className="space-y-6 p-4 max-w-5xl mx-auto w-full">
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 max-w-xl" />
      </div>
      <RandomTeamsToolSkeleton />
    </div>
  );
}
