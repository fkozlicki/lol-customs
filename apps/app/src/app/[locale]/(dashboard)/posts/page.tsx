import { Skeleton } from "@v1/ui/skeleton";
import { Suspense } from "react";
import { PostList } from "@/components/forum/post-list";
import { HydrateClient, prefetch, trpc } from "@/trpc/server";

function PostListSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-24 w-full rounded-lg" />
      ))}
    </div>
  );
}

export default async function PostsPage() {
  prefetch(
    trpc.forum.posts.list.infiniteQueryOptions(
      { limit: 20 },
      { getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined },
    ),
  );

  return (
    <HydrateClient>
      <div className="space-y-6 p-4 max-w-3xl mx-auto w-full">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Posts</h1>
          <p className="text-muted-foreground text-sm">
            Community posts and discussions.
          </p>
        </div>
        <Suspense fallback={<PostListSkeleton />}>
          <PostList />
        </Suspense>
      </div>
    </HydrateClient>
  );
}
