import { cn } from "@v1/ui/cn";
import { Skeleton } from "@v1/ui/skeleton";

export default function MatchCardSkeleton({
  className,
}: {
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-stretch border border-l-4 border-l-foreground/20 bg-card",
        className,
      )}
    >
      <div className="flex min-w-0 flex-1 items-center gap-4 px-3 py-3 sm:gap-6 sm:px-4">
        <div className="w-16 shrink-0 space-y-2">
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-3 w-16" />
        </div>

        <div className="hidden w-28 shrink-0 space-y-2 sm:block">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-5 w-24" />
        </div>

        <div className="flex min-w-0 flex-1 gap-6">
          {[0, 1].map((block) => (
            <div key={block} className="flex items-center gap-2">
              <Skeleton className="size-9 shrink-0" />
              <div className="space-y-2">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-4 w-24" />
              </div>
            </div>
          ))}
        </div>

        <div className="hidden shrink-0 gap-4 lg:flex">
          {[0, 1].map((side) => (
            <div key={side} className="w-[120px] space-y-1.5">
              <Skeleton className="h-3 w-16" />
              {Array.from({ length: 5 }).map((_, row) => (
                <Skeleton key={row} className="h-3.5 w-full" />
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className="w-9 shrink-0 border-l" />
    </div>
  );
}
