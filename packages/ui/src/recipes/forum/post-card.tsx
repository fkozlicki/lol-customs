"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { Icons } from "../../components/icons";
import { AuthorLine } from "./author-line";
import type { PostCardView } from "./post-view";

/** A post in the forum list: who and when, the title, an excerpt, and its counts. */
export function PostCard({ post }: { post: PostCardView }) {
  const t = useTranslations("forum");

  return (
    <article>
      <Link href={post.href} className="group block space-y-3 py-6">
        <AuthorLine
          name={post.authorName ?? t("unknownAuthor")}
          avatarUrl={post.avatarUrl}
          date={post.createdAt}
        />

        <h2 className="text-2xl font-semibold leading-tight tracking-[-0.02em] underline-offset-4 group-hover:underline">
          {post.title}
        </h2>

        {post.excerpt && (
          <p className="line-clamp-2 max-w-2xl text-sm text-muted-foreground">
            {post.excerpt}
          </p>
        )}

        <div className="num flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Icons.MessageSquare className="size-3.5" />
            {post.commentCount}
          </span>
          <span className="flex items-center gap-1.5">
            <Icons.ThumbsUp className="size-3.5" />
            {post.likes}
          </span>
          {post.dislikes > 0 && (
            <span className="flex items-center gap-1.5">
              <Icons.ThumbsDown className="size-3.5" />
              {post.dislikes}
            </span>
          )}
        </div>
      </Link>
    </article>
  );
}
