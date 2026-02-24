"use client";

import { useSuspenseQuery } from "@tanstack/react-query";
import { Avatar, AvatarFallback, AvatarImage } from "@v1/ui/avatar";
import { Separator } from "@v1/ui/separator";
import { formatDistanceToNow } from "date-fns";
import { useTRPC } from "@/trpc/react";
import { CommentList } from "./comment-list";
import { ReactionButtons } from "./reaction-buttons";
import { TipTapRenderer } from "./tiptap-renderer";

interface PostDetailProps {
  postId: string;
}

export function PostDetail({ postId }: PostDetailProps) {
  const trpc = useTRPC();
  const { data: post } = useSuspenseQuery(
    trpc.forum.posts.get.queryOptions({ id: postId }),
  );

  if (!post) return null;

  const author = Array.isArray(post.author) ? post.author[0] : post.author;

  return (
    <div className="space-y-6">
      {/* Post header */}
      <div className="space-y-1">
        <div className="flex items-center gap-2 mt-2">
          <Avatar className="size-8">
            <AvatarImage src={author?.avatar_url ?? undefined} />
            <AvatarFallback className="text-xs">
              {author?.nickname?.[0]?.toUpperCase() ?? "?"}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="text-sm font-medium">
              {author?.nickname ?? "Unknown"}
            </span>
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(post.created_at), {
                addSuffix: true,
              })}
            </span>
          </div>
        </div>
        <h1 className="text-2xl font-bold tracking-tight">{post.title}</h1>
      </div>

      {/* Post content */}
      {post.content && Object.keys(post.content).length > 0 && (
        <TipTapRenderer content={post.content as Record<string, unknown>} />
      )}

      {/* Reactions */}
      <div className="flex items-center gap-2">
        <ReactionButtons
          postId={post.id}
          likes={post.likes}
          dislikes={post.dislikes}
          reactions={post.reactions as { type: string; user_id: string }[]}
        />
      </div>

      <Separator />

      {/* Comments */}
      <CommentList postId={postId} />
    </div>
  );
}
