import { Skeleton } from "../../components/skeleton";
import { PostCardSkeleton } from "./post-card-skeleton";

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
