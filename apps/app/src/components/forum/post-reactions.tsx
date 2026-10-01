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

interface PostReactionsProps {
  postId: string;
  likes: number;
  dislikes: number;
  reactions: Reaction[];
}

/** A post's reactions, updated in the post's cache before the server answers. */
export function PostReactions({
  postId,
  likes,
  dislikes,
  reactions,
}: PostReactionsProps) {
  const t = useTranslations("dashboard.pages.posts");
  const { profile, openSignInDialog } = useUser();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const post = trpc.forum.posts.get.queryOptions({ id: postId });

  const toggle = useMutation(
    trpc.forum.reactions.toggle.mutationOptions({
      onMutate: async ({ type }) => {
        await queryClient.cancelQueries(post);
        const prev = queryClient.getQueryData(post.queryKey);
        queryClient.setQueryData(post.queryKey, (old: typeof prev) =>
          old && profile ? withReactionToggled(old, profile.id, type) : old,
        );
        return { prev };
      },
      onError: (_err, _vars, context) => {
        if (context?.prev) {
          queryClient.setQueryData(post.queryKey, context.prev);
        }
        toast.error(t("reactionFailed"));
      },
      onSettled: () => {
        queryClient.invalidateQueries(post);
        // The list shows each post's counts too.
        queryClient.invalidateQueries(trpc.forum.posts.list.queryOptions({}));
      },
    }),
  );

  function handleReaction(type: ReactionType) {
    if (!profile) {
      openSignInDialog();
      return;
    }
    toggle.mutate({ postId, type });
  }

  return (
    <ReactionButtons
      likes={likes}
      dislikes={dislikes}
      myReaction={myReaction(reactions, profile?.id ?? null)}
      onToggle={handleReaction}
      likeLabel={t("like")}
      dislikeLabel={t("dislike")}
    />
  );
}
