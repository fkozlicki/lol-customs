import { Skeleton } from "@v1/ui/skeleton";

/** One post card while it loads: author line, title, two lines of excerpt, the counts. */
export function PostCardSkeleton() {
  return (
    <div className="space-y-3 py-6">
      <div className="flex items-center gap-2">
        <Skeleton className="size-5" />
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-3 w-20" />
      </div>
      <Skeleton className="h-7 w-2/3" />
      <div className="max-w-2xl space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-4/5" />
      </div>
      <div className="flex items-center gap-4">
        <Skeleton className="h-3.5 w-10" />
        <Skeleton className="h-3.5 w-10" />
      </div>
    </div>
  );
}

export default function PostListSkeleton() {
  return (
    <div>
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-8 w-28" />
      </div>

      <div className="divide-y">
        {Array.from({ length: 5 }).map((_, i) => (
          <PostCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
