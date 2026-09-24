"use client";

import { useSuspenseQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Icons } from "@/components/icons";
import { useScopedI18n } from "@/locales/client";
import { AuthorLine } from "./author-line";
import { useTRPC } from "@/trpc/react";
import { CommentList } from "./comment-list";
import { PostReactions } from "./post-reactions";
import { TipTapRenderer } from "./tiptap-renderer";

interface PostDetailProps {
  postId: string;
}

export function PostDetails({ postId }: PostDetailProps) {
  const t = useScopedI18n("dashboard.pages.posts");
  const trpc = useTRPC();
  const { data: post } = useSuspenseQuery(
    trpc.forum.posts.get.queryOptions({ id: postId }),
  );

  if (!post) return null;

  const author = Array.isArray(post.author) ? post.author[0] : post.author;

  return (
    <article className="space-y-8">
      <Link
        href="/posts"
        className="label-caps inline-flex items-center gap-1 underline-offset-4 hover:text-foreground hover:underline"
      >
        <Icons.ChevronLeft className="size-3.5" />
        {t("backToPosts")}
      </Link>

      <header className="space-y-4">
        <h1 className="text-3xl font-semibold leading-tight tracking-[-0.03em] sm:text-5xl">
          {post.title}
        </h1>
        <AuthorLine
          name={author?.nickname ?? t("unknown")}
          avatarUrl={author?.avatar_url}
          date={post.created_at}
          size="md"
        />
      </header>

      {post.content && Object.keys(post.content).length > 0 && (
        <TipTapRenderer content={post.content as Record<string, unknown>} />
      )}

      <div className="flex items-center gap-2">
        <PostReactions
          postId={post.id}
          likes={post.likes}
          dislikes={post.dislikes}
          reactions={post.reactions as { type: string; user_id: string }[]}
        />
      </div>

      <CommentList postId={postId} />
    </article>
  );
}
