"use client";

import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { AuthorLine } from "./author-line";
import { BackToPosts } from "./back-to-posts";
import type { PostArticleView } from "./post-view";
import { TipTapRenderer } from "./tiptap-renderer";

interface PostArticleProps {
  post: PostArticleView;
  backHref: string;
  /** The reader's reactions to the post. */
  reactions: ReactNode;
  /** The comment thread below it. */
  comments: ReactNode;
}

/** A post on its own page: title, author, body, reactions, then the comments. */
export function PostArticle({
  post,
  backHref,
  reactions,
  comments,
}: PostArticleProps) {
  const t = useTranslations("forum");

  return (
    <article className="space-y-8">
      <BackToPosts href={backHref} />

      <header className="space-y-4">
        <h1 className="text-3xl font-semibold leading-tight tracking-[-0.03em] sm:text-5xl">
          {post.title}
        </h1>
        <AuthorLine
          name={post.authorName ?? t("unknownAuthor")}
          avatarUrl={post.avatarUrl}
          date={post.createdAt}
          size="md"
        />
      </header>

      {post.content && <TipTapRenderer content={post.content} />}

      <div className="flex items-center gap-2">{reactions}</div>

      {comments}
    </article>
  );
}
