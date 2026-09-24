"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@v1/ui/button";
import { cn } from "@v1/ui/cn";
import { toast } from "@v1/ui/sonner";
import { useUser } from "@/components/auth/user-context";
import { Icons } from "@/components/icons";
import { useScopedI18n } from "@/locales/client";
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
  const t = useScopedI18n("dashboard.pages.posts");
  const { profile, openSignInDialog } = useUser();
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const myReaction = profile
    ? (reactions.find((r) => r.user_id === profile.id)?.type ?? null)
    : null;

  const listQueryOptions = trpc.forum.comments.list.queryOptions({ postId });

  const toggleMutation = useMutation(
    trpc.forum.commentReactions.toggle.mutationOptions({
      onMutate: async ({ type }) => {
        await queryClient.cancelQueries(listQueryOptions);
        const prev = queryClient.getQueryData(listQueryOptions.queryKey);
        queryClient.setQueryData(
          listQueryOptions.queryKey,
          (old: typeof prev) => {
            if (!old || !profile) return old;
            return {
              ...old,
              items: old.items.map((comment) => {
                if (comment.id !== commentId) return comment;
                const filtered = comment.reactions.filter(
                  (r) => r.user_id !== profile.id,
                );
                const newReactions =
                  myReaction === type
                    ? filtered
                    : [...filtered, { type, user_id: profile.id }];
                return {
                  ...comment,
                  reactions: newReactions,
                  likes: newReactions.filter((r) => r.type === "like").length,
                  dislikes: newReactions.filter((r) => r.type === "dislike")
                    .length,
                };
              }),
            };
          },
        );
        return { prev };
      },
      onError: (_err, _vars, context) => {
        if (context?.prev) {
          queryClient.setQueryData(listQueryOptions.queryKey, context.prev);
        }
        toast.error(t("reactionFailed"));
      },
      onSettled: () => {
        queryClient.invalidateQueries(listQueryOptions);
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
        aria-pressed={myReaction === "like"}
        className={cn(
          "gap-1.5 h-7 px-2 text-muted-foreground hover:text-foreground",
          myReaction === "like" && "text-foreground",
        )}
        onClick={() => handleReaction("like")}
      >
        <Icons.ThumbsUp
          className={cn("size-3.5", myReaction === "like" && "fill-current")}
        />
        <span className="num text-xs">{initialLikes}</span>
      </Button>
      <Button
        variant="ghost"
        size="sm"
        aria-pressed={myReaction === "dislike"}
        className={cn(
          "gap-1.5 h-7 px-2 text-muted-foreground hover:text-foreground",
          myReaction === "dislike" && "text-foreground",
        )}
        onClick={() => handleReaction("dislike")}
      >
        <Icons.ThumbsDown
          className={cn("size-3.5", myReaction === "dislike" && "fill-current")}
        />
        <span className="num text-xs">{initialDislikes}</span>
      </Button>
    </div>
  );
}
