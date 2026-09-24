"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@v1/ui/sonner";
import { useUser } from "@/components/auth/user-context";
import { useScopedI18n } from "@/locales/client";
import { useTRPC } from "@/trpc/react";
import { ReactionButtons } from "./reaction-buttons";

interface CommentReactionsProps {
  commentId: string;
  postId: string;
  likes: number;
  dislikes: number;
  reactions: { type: string; user_id: string }[];
}

export function CommentReactions({
  commentId,
  postId,
  likes: initialLikes,
  dislikes: initialDislikes,
  reactions,
}: CommentReactionsProps) {
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
    <ReactionButtons
      size="sm"
      likes={initialLikes}
      dislikes={initialDislikes}
      myReaction={myReaction}
      onToggle={handleReaction}
      likeLabel={t("like")}
      dislikeLabel={t("dislike")}
    />
  );
}
