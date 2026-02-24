"use client";

import { useSuspenseInfiniteQuery } from "@tanstack/react-query";
import { Button } from "@v1/ui/button";
import { Icons } from "@v1/ui/icons";
import { Skeleton } from "@v1/ui/skeleton";
import { useRouter } from "next/navigation";
import { useUser } from "@/components/auth/user-context";
import { useTRPC } from "@/trpc/react";
import { PostCard } from "./post-card";

export function PostList() {
  const { profile, openSignInDialog } = useUser();
  const trpc = useTRPC();
  const router = useRouter();

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    useSuspenseInfiniteQuery(
      trpc.forum.posts.list.infiniteQueryOptions(
        { limit: 20 },
        { getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined },
      ),
    );

  const posts = data?.pages.flatMap((p) => p.items) ?? [];

  function handleNewPost() {
    if (!profile) {
      openSignInDialog();
      return;
    }
    router.push("/posts/new");
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {isLoading
            ? ""
            : `${posts.length} post${posts.length === 1 ? "" : "s"}`}
        </p>
        <Button onClick={handleNewPost} size="sm" className="gap-1.5">
          <Icons.PenSquare className="size-4" />
          New post
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-lg" />
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-12 text-center">
          <p className="text-muted-foreground text-sm">
            No posts yet. Be the first to post!
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}

      {hasNextPage && (
        <div className="flex justify-center pt-2">
          <Button
            variant="outline"
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
          >
            {isFetchingNextPage ? "Loading..." : "Load more"}
          </Button>
        </div>
      )}
    </div>
  );
}
