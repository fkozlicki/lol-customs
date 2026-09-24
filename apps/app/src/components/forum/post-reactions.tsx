"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@v1/ui/sonner";
import { useUser } from "@/components/auth/user-context";
import { useScopedI18n } from "@/locales/client";
import { useTRPC } from "@/trpc/react";
import { ReactionButtons } from "./reaction-buttons";

interface PostReactionsProps {
  postId: string;
  likes: number;
  dislikes: number;
  reactions: { type: string; user_id: string }[];
}

export function PostReactions({
  postId,
  likes: initialLikes,
  dislikes: initialDislikes,
  reactions,
}: PostReactionsProps) {
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
    <ReactionButtons
      likes={initialLikes}
      dislikes={initialDislikes}
      myReaction={myReaction}
      onToggle={handleReaction}
      likeLabel={t("like")}
      dislikeLabel={t("dislike")}
    />
  );
}
