"use client";

import { useSuspenseQuery } from "@tanstack/react-query";
import { Avatar, AvatarFallback, AvatarImage } from "@v1/ui/avatar";
import { Button } from "@v1/ui/button";
import { useState } from "react";
import { RelativeTime } from "@/components/relative-time";
import { useScopedI18n } from "@/locales/client";
import { useTRPC } from "@/trpc/react";
import { CommentForm } from "./comment-form";
import { CommentReactionButtons } from "./comment-reaction-buttons";
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
                <div className="flex items-center gap-2">
                  <Avatar className="size-5 shrink-0 rounded-none">
                    <AvatarImage
                      src={author?.avatar_url ?? undefined}
                      className="rounded-none"
                    />
                    <AvatarFallback className="rounded-none text-[10px] font-semibold">
                      {author?.nickname?.[0]?.toUpperCase() ?? "?"}
                    </AvatarFallback>
                  </Avatar>
                  <span className="label-caps text-foreground">
                    {author?.nickname ?? t("unknown")}
                  </span>
                  <RelativeTime
                    date={comment.created_at}
                    className="label-caps"
                  />
                </div>
                <TipTapRenderer
                  content={comment.content as Record<string, unknown>}
                />
                <CommentReactionButtons
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
