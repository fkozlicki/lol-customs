import { Skeleton } from "@v1/ui/skeleton";

export default function PostDetailsSkeleton() {
  return (
    <div className="space-y-8">
      <Skeleton className="h-3.5 w-28" />

      <div className="space-y-4">
        <div className="space-y-2">
          <Skeleton className="h-9 w-full sm:h-12" />
          <Skeleton className="h-9 w-2/3 sm:h-12" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="size-6" />
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-3 w-20" />
        </div>
      </div>

      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-4/5" />
        <Skeleton className="h-4 w-1/2" />
      </div>

      <div className="flex items-center gap-2">
        <Skeleton className="h-8 w-16" />
        <Skeleton className="h-8 w-16" />
      </div>

      <div className="space-y-6 border-t pt-6">
        <Skeleton className="h-3.5 w-32" />
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <div className="flex items-center gap-2">
              <Skeleton className="size-5" />
              <Skeleton className="h-3 w-20" />
            </div>
            <Skeleton className="h-4 w-3/4" />
          </div>
        ))}
      </div>
    </div>
  );
}
