"use client";

import { Button } from "@v1/ui/button";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Icons } from "@v1/ui/icons";
import { toast } from "@v1/ui/sonner";
import { cn } from "@v1/ui/cn";
import { useUser } from "@/components/auth/user-context";
import { useTRPC } from "@/trpc/react";

interface ReactionButtonsProps {
  postId: string;
  likes: number;
  dislikes: number;
  reactions: { type: string; user_id: string }[];
}

export function ReactionButtons({
  postId,
  likes: initialLikes,
  dislikes: initialDislikes,
  reactions,
}: ReactionButtonsProps) {
  const { profile, openSignInDialog } = useUser();
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const myReaction = profile
    ? reactions.find((r) => r.user_id === profile.id)?.type ?? null
    : null;

  const toggleMutation = useMutation(
    trpc.forum.reactions.toggle.mutationOptions({
      onMutate: async ({ type }) => {
        await queryClient.cancelQueries(
          trpc.forum.posts.get.queryOptions({ id: postId }),
        );
        const prev = queryClient.getQueryData(
          trpc.forum.posts.get.queryOptions({ id: postId }).queryKey,
        );
        queryClient.setQueryData(
          trpc.forum.posts.get.queryOptions({ id: postId }).queryKey,
          (old: typeof prev) => {
            if (!old || !profile) return old;
            const filtered = old.reactions.filter(
              (r) => r.user_id !== profile.id,
            );
            const newReactions =
              myReaction === type
                ? filtered
                : [...filtered, { type, user_id: profile.id }];
            return {
              ...old,
              reactions: newReactions,
              likes: newReactions.filter((r) => r.type === "like").length,
              dislikes: newReactions.filter((r) => r.type === "dislike").length,
            };
          },
        );
        return { prev };
      },
      onError: (_err, _vars, context) => {
        if (context?.prev) {
          queryClient.setQueryData(
            trpc.forum.posts.get.queryOptions({ id: postId }).queryKey,
            context.prev,
          );
        }
        toast.error("Failed to update reaction");
      },
      onSettled: () => {
        queryClient.invalidateQueries(
          trpc.forum.posts.get.queryOptions({ id: postId }),
        );
        queryClient.invalidateQueries(trpc.forum.posts.list.queryOptions({}));
      },
    }),
  );

  function handleReaction(type: "like" | "dislike") {
    if (!profile) {
      openSignInDialog();
      return;
    }
    toggleMutation.mutate({ postId, type });
  }

  return (
    <div className="flex items-center gap-1">
      <Button
        variant="ghost"
        size="sm"
        className={cn(
          "gap-1.5 h-8 px-2",
          myReaction === "like" && "text-green-500 hover:text-green-500",
        )}
        onClick={() => handleReaction("like")}
        disabled={toggleMutation.isPending}
      >
        <Icons.ThumbsUp className="size-4" />
        <span className="text-xs tabular-nums">{initialLikes}</span>
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className={cn(
          "gap-1.5 h-8 px-2",
          myReaction === "dislike" && "text-red-500 hover:text-red-500",
        )}
        onClick={() => handleReaction("dislike")}
        disabled={toggleMutation.isPending}
      >
        <Icons.ThumbsDown className="size-4" />
        <span className="text-xs tabular-nums">{initialDislikes}</span>
      </Button>
    </div>
  );
}
