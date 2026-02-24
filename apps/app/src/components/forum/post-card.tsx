"use client";

import type { RouterOutputs } from "@v1/api";
import { Avatar, AvatarFallback, AvatarImage } from "@v1/ui/avatar";
import { Icons } from "@v1/ui/icons";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";

type Post = RouterOutputs["forum"]["posts"]["list"]["items"][number];

type TipTapNode = {
  type?: string;
  text?: string;
  content?: TipTapNode[];
};

function extractPlainText(node: TipTapNode): string {
  if (node.text) return node.text;
  if (Array.isArray(node.content)) {
    return node.content.map(extractPlainText).join(" ");
  }
  return "";
}

function getContentPreview(
  content: Record<string, unknown>,
  maxLength = 120,
): string {
  const text = extractPlainText(content as TipTapNode).trim();
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength).trimEnd()}…`;
}

interface PostCardProps {
  post: Post;
}

export function PostCard({ post }: PostCardProps) {
  const author = Array.isArray(post.author) ? post.author[0] : post.author;

  return (
    <Link
      href={`/posts/${post.id}`}
      className="block rounded-lg border border-border bg-card p-4 hover:bg-accent/50 transition-colors"
    >
      <div className="space-y-2">
        <div className="flex items-center gap-1">
          <Avatar className="size-6 shrink-0">
            <AvatarImage src={author?.avatar_url ?? undefined} />
            <AvatarFallback className="text-xs font-semibold">
              {author?.nickname?.[0]?.toUpperCase() ?? "?"}
            </AvatarFallback>
          </Avatar>

          <div className="flex items-center gap-1.5 mt-0.5 text-xs flex-wrap">
            <span className="font-semibold">
              {author?.nickname ?? "Unknown"}
            </span>
            <span>·</span>
            <span className="text-muted-foreground">
              {formatDistanceToNow(new Date(post.created_at), {
                addSuffix: true,
              })}
            </span>
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <h2 className="font-semibold text-foreground leading-snug truncate">
            {post.title}
          </h2>

          {post.content && Object.keys(post.content).length > 0 && (
            <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">
              {getContentPreview(post.content as Record<string, unknown>)}
            </p>
          )}
        </div>

        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Icons.ThumbsUp className="size-3.5" />
            {post.likes}
          </span>
          <span className="flex items-center gap-1">
            <Icons.ThumbsDown className="size-3.5" />
            {post.dislikes}
          </span>
          <span className="flex items-center gap-1">
            <Icons.MessageSquare className="size-3.5" />
            {post.commentCount}
          </span>
        </div>
      </div>
    </Link>
  );
}
