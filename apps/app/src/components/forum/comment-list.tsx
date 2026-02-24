"use client";

import { useSuspenseQuery } from "@tanstack/react-query";
import { Avatar, AvatarFallback, AvatarImage } from "@v1/ui/avatar";
import { Button } from "@v1/ui/button";
import { formatDistanceToNow } from "date-fns";
import { useState } from "react";
import { useTRPC } from "@/trpc/react";
import { CommentForm } from "./comment-form";
import { CommentReactionButtons } from "./comment-reaction-buttons";
import { TipTapRenderer } from "./tiptap-renderer";

interface CommentListProps {
  postId: string;
}

export function CommentList({ postId }: CommentListProps) {
  const trpc = useTRPC();
  const { data } = useSuspenseQuery(
    trpc.forum.comments.list.queryOptions({ postId }),
  );
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="space-y-4">
      {showForm ? (
        <CommentForm postId={postId} onCancel={() => setShowForm(false)} />
      ) : (
        <Button
          variant="outline"
          size="lg"
          onClick={() => setShowForm(true)}
          className="w-full"
        >
          Join the conversation
        </Button>
      )}

      {data.items.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4 text-center">
          No comments yet. Be the first!
        </p>
      ) : (
        <div className="space-y-4">
          {data.items.map((comment) => {
            const author = Array.isArray(comment.author)
              ? comment.author[0]
              : comment.author;
            const reactions = Array.isArray(comment.reactions)
              ? comment.reactions
              : [];
            return (
              <div key={comment.id} className="flex gap-3">
                <Avatar className="size-7 shrink-0 mt-0.5">
                  <AvatarImage src={author?.avatar_url ?? undefined} />
                  <AvatarFallback className="text-xs">
                    {author?.nickname?.[0]?.toUpperCase() ?? "?"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <span className="text-sm font-medium">
                      {author?.nickname ?? "Unknown"}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(comment.created_at), {
                        addSuffix: true,
                      })}
                    </span>
                  </div>
                  <div className="mt-1">
                    <TipTapRenderer
                      content={comment.content as Record<string, unknown>}
                    />
                  </div>
                  <CommentReactionButtons
                    commentId={comment.id}
                    postId={postId}
                    likes={comment.likes}
                    dislikes={comment.dislikes}
                    reactions={reactions}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
