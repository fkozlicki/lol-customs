import { Skeleton } from "../../components/skeleton";

/** The draw while the ladder's players load: the roster and the picker, side by side. */
export function DrawSkeleton() {
  return (
    <div className="grid gap-10 md:grid-cols-2 md:gap-16">
      <Skeleton className="h-96 w-full" />
      <Skeleton className="h-96 w-full" />
    </div>
  );
}
