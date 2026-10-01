"use client";

import { useSuspenseInfiniteQuery } from "@tanstack/react-query";
import { PostList as PostListView } from "@v1/ui/recipes/forum/post-list";
import { useTRPC } from "@/trpc/react";
import { NewPostButton } from "./new-post-button";
import { toPostCardView } from "./post-view";

/** The forum's posts, ten at a time, with the way to write one. */
export function PostList() {
  const trpc = useTRPC();

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useSuspenseInfiniteQuery(
      trpc.forum.posts.list.infiniteQueryOptions(
        { limit: 10 },
        { getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined },
      ),
    );

  return (
    <PostListView
      posts={data.pages.flatMap((page) => page.items).map(toPostCardView)}
      newPostAction={<NewPostButton size="sm" />}
      emptyAction={<NewPostButton />}
      hasNextPage={hasNextPage}
      isFetchingNextPage={isFetchingNextPage}
      onLoadMore={fetchNextPage}
    />
  );
}
