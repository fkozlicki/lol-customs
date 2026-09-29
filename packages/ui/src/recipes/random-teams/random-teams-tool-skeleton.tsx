import { Skeleton } from "../../components/skeleton";

/** Matches the shuffle while it loads: the roster and the drawn teams, side by side. */
export function RandomTeamsToolSkeleton() {
  return (
    <div className="grid gap-10 md:grid-cols-2 md:gap-16">
      <Skeleton className="h-96 w-full" />
      <Skeleton className="h-96 w-full" />
    </div>
  );
}
