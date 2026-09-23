"use client";

import { useSuspenseInfiniteQuery } from "@tanstack/react-query";
import { Button } from "@v1/ui/button";
import { Icons } from "@v1/ui/icons";
import { useRouter } from "next/navigation";
import { useUser } from "@/components/auth/user-context";
import { useScopedI18n } from "@/locales/client";
import { useTRPC } from "@/trpc/react";
import { InfiniteScrollTrigger } from "../infinite-scroll-trigger";
import { PostCard } from "./post-card";

export function PostList() {
  const { profile, openSignInDialog } = useUser();
  const t = useScopedI18n("dashboard.pages.posts");
  const trpc = useTRPC();
  const router = useRouter();

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    useSuspenseInfiniteQuery(
      trpc.forum.posts.list.infiniteQueryOptions(
        { limit: 10 },
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

  if (!posts.length) {
    return (
      <div className="flex flex-col items-start gap-4 border-t pt-10">
        <p className="text-xl font-semibold tracking-[-0.02em]">
          {t("noPosts")}
        </p>
        <Button variant="outline" onClick={handleNewPost}>
          <Icons.PenSquare className="size-4" />
          {t("newPost")}
        </Button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <p className="label-caps">
          {isLoading ? "" : t("postCount", { count: posts.length })}
        </p>
        <Button onClick={handleNewPost} size="sm" variant="outline">
          <Icons.PenSquare className="size-4" />
          {t("newPost")}
        </Button>
      </div>

      <div className="divide-y">
        {posts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>

      <InfiniteScrollTrigger
        hasNextPage={hasNextPage}
        isFetchingNextPage={isFetchingNextPage}
        onLoadMore={fetchNextPage}
      />
    </div>
  );
}
