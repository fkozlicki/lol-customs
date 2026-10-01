"use client";

import { useSuspenseInfiniteQuery } from "@tanstack/react-query";
import { PostList as PostListView } from "@v1/ui/recipes/forum/post-list";
import { useRouter } from "next/navigation";
import { useUser } from "@/components/auth/user-context";
import { useTRPC } from "@/trpc/react";
import { toPostCardView } from "./post-view";

/** The forum's posts, ten at a time; writing one asks a signed-out reader to sign in. */
export function PostList() {
  const { profile, openSignInDialog } = useUser();
  const trpc = useTRPC();
  const router = useRouter();

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
      onNewPost={() =>
        profile ? router.push("/posts/new") : openSignInDialog()
      }
      hasNextPage={hasNextPage}
      isFetchingNextPage={isFetchingNextPage}
      onLoadMore={fetchNextPage}
    />
  );
}
