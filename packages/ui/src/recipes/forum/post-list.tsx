"use client";

import { useTranslations } from "next-intl";
import { InfiniteScrollTrigger } from "../infinite-scroll-trigger";
import { NewPostButton } from "./new-post-button";
import { PostCard } from "./post-card";
import { PostCardSkeleton } from "./post-card-skeleton";
import { PostListEmpty } from "./post-list-empty";
import type { PostCardView } from "./post-view";

interface PostListProps {
  posts: PostCardView[];
  onNewPost: () => void;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  onLoadMore: () => void;
}

/** The forum: how many posts, the way to write one, and the posts, loading more on scroll. */
export function PostList({
  posts,
  onNewPost,
  hasNextPage,
  isFetchingNextPage,
  onLoadMore,
}: PostListProps) {
  const t = useTranslations("forum");

  if (posts.length === 0) return <PostListEmpty onNewPost={onNewPost} />;

  return (
    <div>
      <div className="flex items-center justify-between">
        <p className="label-caps">{t("postCount", { count: posts.length })}</p>
        <NewPostButton onClick={onNewPost} size="sm" />
      </div>

      <div className="divide-y">
        {posts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>

      <InfiniteScrollTrigger
        hasNextPage={hasNextPage}
        isFetchingNextPage={isFetchingNextPage}
        onLoadMore={onLoadMore}
        loading={
          <div className="divide-y border-t">
            <PostCardSkeleton />
            <PostCardSkeleton />
          </div>
        }
      />
    </div>
  );
}
