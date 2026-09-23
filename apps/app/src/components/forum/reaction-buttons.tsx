"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@v1/ui/button";
import { cn } from "@v1/ui/cn";
import { Icons } from "@v1/ui/icons";
import { toast } from "@v1/ui/sonner";
import { useUser } from "@/components/auth/user-context";
import { useScopedI18n } from "@/locales/client";
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
  const t = useScopedI18n("dashboard.pages.posts");
  const { profile, openSignInDialog } = useUser();
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const myReaction = profile
    ? (reactions.find((r) => r.user_id === profile.id)?.type ?? null)
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
        toast.error(t("reactionFailed"));
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
        aria-pressed={myReaction === "like"}
        className={cn(
          "gap-1.5 h-8 px-2 text-muted-foreground hover:text-foreground",
          myReaction === "like" && "text-foreground",
        )}
        onClick={() => handleReaction("like")}
      >
        <Icons.ThumbsUp
          className={cn("size-4", myReaction === "like" && "fill-current")}
        />
        <span className="num text-xs">{initialLikes}</span>
      </Button>
      <Button
        variant="ghost"
        size="sm"
        aria-pressed={myReaction === "dislike"}
        className={cn(
          "gap-1.5 h-8 px-2 text-muted-foreground hover:text-foreground",
          myReaction === "dislike" && "text-foreground",
        )}
        onClick={() => handleReaction("dislike")}
      >
        <Icons.ThumbsDown
          className={cn("size-4", myReaction === "dislike" && "fill-current")}
        />
        <span className="num text-xs">{initialDislikes}</span>
      </Button>
    </div>
  );
}
