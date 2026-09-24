"use client";

import { useSuspenseQuery } from "@tanstack/react-query";
import { Button } from "@v1/ui/button";
import { useState } from "react";
import { useScopedI18n } from "@/locales/client";
import { AuthorLine } from "./author-line";
import { useTRPC } from "@/trpc/react";
import { CommentForm } from "./comment-form";
import { CommentReactions } from "./comment-reactions";
import { TipTapRenderer } from "./tiptap-renderer";

interface CommentListProps {
  postId: string;
}

export function CommentList({ postId }: CommentListProps) {
  const t = useScopedI18n("dashboard.pages.posts");
  const trpc = useTRPC();
  const { data } = useSuspenseQuery(
    trpc.forum.comments.list.queryOptions({ postId }),
  );
  const [showForm, setShowForm] = useState(false);

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="label-caps text-foreground">
          {t("comments.title", { count: data.items.length })}
        </h2>
        {!showForm && (
          <Button variant="outline" size="sm" onClick={() => setShowForm(true)}>
            {t("comments.joinConversation")}
          </Button>
        )}
      </div>

      {showForm && (
        <CommentForm postId={postId} onCancel={() => setShowForm(false)} />
      )}

      {data.items.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {t("comments.noComments")}
        </p>
      ) : (
        <ol className="divide-y border-b">
          {data.items.map((comment) => {
            const author = Array.isArray(comment.author)
              ? comment.author[0]
              : comment.author;
            const reactions = Array.isArray(comment.reactions)
              ? comment.reactions
              : [];
            return (
              <li key={comment.id} className="space-y-2 py-5">
                <AuthorLine
                  name={author?.nickname ?? t("unknown")}
                  avatarUrl={author?.avatar_url}
                  date={comment.created_at}
                />
                <TipTapRenderer
                  content={comment.content as Record<string, unknown>}
                />
                <CommentReactions
                  commentId={comment.id}
                  postId={postId}
                  likes={comment.likes}
                  dislikes={comment.dislikes}
                  reactions={reactions}
                />
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
