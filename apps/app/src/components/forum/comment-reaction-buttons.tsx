"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@v1/ui/button";
import { cn } from "@v1/ui/cn";
import { Icons } from "@v1/ui/icons";
import { toast } from "@v1/ui/sonner";
import { useUser } from "@/components/auth/user-context";
import { useTRPC } from "@/trpc/react";

interface CommentReactionButtonsProps {
  commentId: string;
  postId: string;
  likes: number;
  dislikes: number;
  reactions: { type: string; user_id: string }[];
}

export function CommentReactionButtons({
  commentId,
  postId,
  likes: initialLikes,
  dislikes: initialDislikes,
  reactions,
}: CommentReactionButtonsProps) {
  const { profile, openSignInDialog } = useUser();
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const myReaction = profile
    ? (reactions.find((r) => r.user_id === profile.id)?.type ?? null)
    : null;

  const toggleMutation = useMutation(
    trpc.forum.commentReactions.toggle.mutationOptions({
      onError: () => {
        toast.error("Failed to update reaction");
      },
      onSettled: () => {
        queryClient.invalidateQueries(
          trpc.forum.comments.list.queryOptions({ postId }),
        );
      },
    }),
  );

  function handleReaction(type: "like" | "dislike") {
    if (!profile) {
      openSignInDialog();
      return;
    }
    toggleMutation.mutate({ commentId, type });
  }

  return (
    <div className="flex items-center gap-1">
      <Button
        variant="ghost"
        size="sm"
        className={cn(
          "gap-1.5 h-7 px-2",
          myReaction === "like" && "text-green-500 hover:text-green-500",
        )}
        onClick={() => handleReaction("like")}
        disabled={toggleMutation.isPending}
      >
        <Icons.ThumbsUp className="size-3.5" />
        <span className="text-xs tabular-nums">{initialLikes}</span>
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className={cn(
          "gap-1.5 h-7 px-2",
          myReaction === "dislike" && "text-red-500 hover:text-red-500",
        )}
        onClick={() => handleReaction("dislike")}
        disabled={toggleMutation.isPending}
      >
        <Icons.ThumbsDown className="size-3.5" />
        <span className="text-xs tabular-nums">{initialDislikes}</span>
      </Button>
    </div>
  );
}
