import { Skeleton } from "@v1/ui/skeleton";

export default function PostsLoading() {
  return (
    <div className="space-y-6 p-4 max-w-3xl mx-auto w-full">
      <div className="space-y-1.5">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-4 w-56" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full rounded-lg" />
        ))}
      </div>
    </div>
  );
}
