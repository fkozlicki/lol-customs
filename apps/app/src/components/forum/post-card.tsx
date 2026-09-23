"use client";

import type { RouterOutputs } from "@v1/api";
import { Avatar, AvatarFallback, AvatarImage } from "@v1/ui/avatar";
import { Icons } from "@v1/ui/icons";
import Link from "next/link";
import { RelativeTime } from "@/components/relative-time";
import { useScopedI18n } from "@/locales/client";

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
  maxLength = 160,
): string {
  const text = extractPlainText(content as TipTapNode).trim();
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength).trimEnd()}…`;
}

export function PostCard({ post }: { post: Post }) {
  const t = useScopedI18n("dashboard.pages.posts");
  const author = Array.isArray(post.author) ? post.author[0] : post.author;

  return (
    <article>
      <Link href={`/posts/${post.id}`} className="group block space-y-3 py-6">
        <div className="flex items-center gap-2">
          <Avatar className="size-5 shrink-0 rounded-none">
            <AvatarImage
              src={author?.avatar_url ?? undefined}
              className="rounded-none"
            />
            <AvatarFallback className="rounded-none text-[10px] font-semibold">
              {author?.nickname?.[0]?.toUpperCase() ?? "?"}
            </AvatarFallback>
          </Avatar>
          <span className="label-caps text-foreground">
            {author?.nickname ?? t("unknown")}
          </span>
          <RelativeTime date={post.created_at} className="label-caps" />
        </div>

        <h2 className="text-2xl font-semibold leading-tight tracking-[-0.02em] underline-offset-4 group-hover:underline">
          {post.title}
        </h2>

        {post.content && Object.keys(post.content).length > 0 && (
          <p className="line-clamp-2 max-w-2xl text-sm text-muted-foreground">
            {getContentPreview(post.content as Record<string, unknown>)}
          </p>
        )}

        <div className="num flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Icons.MessageSquare className="size-3.5" />
            {post.commentCount}
          </span>
          <span className="flex items-center gap-1.5">
            <Icons.ThumbsUp className="size-3.5" />
            {post.likes}
          </span>
          {post.dislikes > 0 && (
            <span className="flex items-center gap-1.5">
              <Icons.ThumbsDown className="size-3.5" />
              {post.dislikes}
            </span>
          )}
        </div>
      </Link>
    </article>
  );
}
