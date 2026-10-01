"use client";

import { useSuspenseQuery } from "@tanstack/react-query";
import { CommentItem } from "@v1/ui/recipes/forum/comment-item";
import { CommentSection } from "@v1/ui/recipes/forum/comment-section";
import { useState } from "react";
import { useTRPC } from "@/trpc/react";
import { CommentForm } from "./comment-form";
import { CommentReactions } from "./comment-reactions";
import { toCommentView } from "./post-view";

/** The thread under a post, with the form to add to it. */
export function CommentList({ postId }: { postId: string }) {
  const trpc = useTRPC();
  const { data } = useSuspenseQuery(
    trpc.forum.comments.list.queryOptions({ postId }),
  );
  const [composing, setComposing] = useState(false);

  return (
    <CommentSection
      count={data.items.length}
      composer={
        composing ? (
          <CommentForm postId={postId} onCancel={() => setComposing(false)} />
        ) : null
      }
      onCompose={() => setComposing(true)}
    >
      {data.items.map((comment) => (
        <CommentItem
          key={comment.id}
          comment={toCommentView(comment)}
          reactions={
            <CommentReactions
              commentId={comment.id}
              postId={postId}
              likes={comment.likes}
              dislikes={comment.dislikes}
              reactions={
                Array.isArray(comment.reactions) ? comment.reactions : []
              }
            />
          }
        />
      ))}
    </CommentSection>
  );
}
