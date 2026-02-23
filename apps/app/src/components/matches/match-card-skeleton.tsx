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
        "rounded-sm border-l-[6px] border-border bg-background",
        className,
      )}
    >
      <div className="flex px-3 py-1 justify-between">
        <div className="space-y-2">
          <Skeleton className="h-6 w-28" />
          <Skeleton className="h-6 w-28" />
        </div>

        <div className="flex gap-4">
          <Skeleton className="h-[88px] w-[100px]" />
          <Skeleton className="h-[88px] w-[100px]" />
        </div>
      </div>
    </div>
  );
}
