import { Skeleton } from "../../components/skeleton";

/** The Hall of Fame while it loads: the collectors, then the first two sections' rows. */
export function HallOfFameSkeleton() {
  return (
    <div className="space-y-16">
      <Skeleton className="h-40 w-full" />
      {[3, 2].map((rows) => (
        <div key={rows} className="space-y-px">
          {Array.from({ length: rows }, (_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      ))}
    </div>
  );
}
