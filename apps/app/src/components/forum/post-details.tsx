"use client";

import { useSuspenseQuery } from "@tanstack/react-query";
import { PostArticle } from "@v1/ui/recipes/forum/post-article";
import { useTRPC } from "@/trpc/react";
import { CommentList } from "./comment-list";
import { PostReactions } from "./post-reactions";
import { toPostArticleView } from "./post-view";
import type { Reaction } from "./reactions";

/** A post on its own page, with its reactions and comments. */
export function PostDetails({ postId }: { postId: string }) {
  const trpc = useTRPC();
  const { data: post } = useSuspenseQuery(
    trpc.forum.posts.get.queryOptions({ id: postId }),
  );

  if (!post) return null;

  return (
    <PostArticle
      post={toPostArticleView(post)}
      backHref="/posts"
      reactions={
        <PostReactions
          postId={post.id}
          likes={post.likes}
          dislikes={post.dislikes}
          reactions={post.reactions as Reaction[]}
        />
      }
      comments={<CommentList postId={postId} />}
    />
  );
}
