"use client";

import type { RouterOutputs } from "@v1/api";
import Link from "next/link";
import { Icons } from "@/components/icons";
import { useScopedI18n } from "@/locales/client";
import { postExcerpt, type TipTapNode } from "@/utils/post-excerpt";
import { AuthorLine } from "./author-line";

type Post = RouterOutputs["forum"]["posts"]["list"]["items"][number];

export function PostCard({ post }: { post: Post }) {
  const t = useScopedI18n("dashboard.pages.posts");
  const author = Array.isArray(post.author) ? post.author[0] : post.author;

  return (
    <article>
      <Link href={`/posts/${post.id}`} className="group block space-y-3 py-6">
        <AuthorLine
          name={author?.nickname ?? t("unknown")}
          avatarUrl={author?.avatar_url}
          date={post.created_at}
        />

        <h2 className="text-2xl font-semibold leading-tight tracking-[-0.02em] underline-offset-4 group-hover:underline">
          {post.title}
        </h2>

        {post.content && Object.keys(post.content).length > 0 && (
          <p className="line-clamp-2 max-w-2xl text-sm text-muted-foreground">
            {postExcerpt(post.content as TipTapNode)}
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
