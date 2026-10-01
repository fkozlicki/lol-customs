"use client";

import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { AuthorLine } from "./author-line";
import type { CommentView } from "./post-view";
import { TipTapRenderer } from "./tiptap-renderer";

interface CommentItemProps {
  comment: CommentView;
  /** The reader's reactions to the comment. */
  reactions: ReactNode;
}

/** A comment in the thread: who and when, what they wrote, and the reactions. */
export function CommentItem({ comment, reactions }: CommentItemProps) {
  const t = useTranslations("forum");

  return (
    <li className="space-y-2 py-5">
      <AuthorLine
        name={comment.authorName ?? t("unknownAuthor")}
        avatarUrl={comment.avatarUrl}
        date={comment.createdAt}
      />
      <TipTapRenderer content={comment.content} />
      {reactions}
    </li>
  );
}
