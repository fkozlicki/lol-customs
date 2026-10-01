"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ReactionButtons } from "@v1/ui/recipes/forum/reaction-buttons";
import { toast } from "@v1/ui/sonner";
import { useTranslations } from "next-intl";
import { useUser } from "@/components/auth/user-context";
import { useTRPC } from "@/trpc/react";
import {
  myReaction,
  type Reaction,
  type ReactionType,
  withReactionToggled,
} from "./reactions";

interface CommentReactionsProps {
  commentId: string;
  postId: string;
  likes: number;
  dislikes: number;
  reactions: Reaction[];
}

/** A comment's reactions, updated in the thread's cache before the server answers. */
export function CommentReactions({
  commentId,
  postId,
  likes,
  dislikes,
  reactions,
}: CommentReactionsProps) {
  const t = useTranslations("dashboard.pages.posts");
  const { profile, openSignInDialog } = useUser();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const thread = trpc.forum.comments.list.queryOptions({ postId });

  const toggle = useMutation(
    trpc.forum.commentReactions.toggle.mutationOptions({
      onMutate: async ({ type }) => {
        await queryClient.cancelQueries(thread);
        const prev = queryClient.getQueryData(thread.queryKey);
        queryClient.setQueryData(thread.queryKey, (old: typeof prev) => {
          if (!old || !profile) return old;
          return {
            ...old,
            items: old.items.map((comment) =>
              comment.id === commentId
                ? withReactionToggled(comment, profile.id, type)
                : comment,
            ),
          };
        });
        return { prev };
      },
      onError: (_err, _vars, context) => {
        if (context?.prev) {
          queryClient.setQueryData(thread.queryKey, context.prev);
        }
        toast.error(t("reactionFailed"));
      },
      onSettled: () => {
        queryClient.invalidateQueries(thread);
      },
    }),
  );

  function handleReaction(type: ReactionType) {
    if (!profile) {
      openSignInDialog();
      return;
    }
    toggle.mutate({ commentId, type });
  }

  return (
    <ReactionButtons
      size="sm"
      likes={likes}
      dislikes={dislikes}
      myReaction={myReaction(reactions, profile?.id ?? null)}
      onToggle={handleReaction}
      likeLabel={t("like")}
      dislikeLabel={t("dislike")}
    />
  );
}
