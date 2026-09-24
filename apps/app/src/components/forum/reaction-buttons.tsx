"use client";

import { Button } from "@v1/ui/button";
import { cn } from "@v1/ui/cn";
import { cva, type VariantProps } from "class-variance-authority";
import { Icons } from "@/components/icons";

/**
 * Thumbs up, thumbs down, and the two counts.
 *
 * A post and a comment render exactly this, one step apart in size. What they do *not* share is the
 * optimistic update behind it: a post patches `posts.get`, a comment patches one entry inside
 * `comments.list`. Those are different enough that folding them into one component would mean a
 * branch on which kind of thing was reacted to, so the cache work stays in `post-reactions.tsx` and
 * `comment-reactions.tsx` and only the buttons live here.
 */
const reactionButton = cva(
  "gap-1.5 px-2 text-muted-foreground hover:text-foreground",
  {
    variants: {
      size: { sm: "h-7", md: "h-8" },
    },
    defaultVariants: { size: "md" },
  },
);

const ICON_SIZE = { sm: "size-3.5", md: "size-4" } as const;

interface ReactionButtonsProps extends VariantProps<typeof reactionButton> {
  likes: number;
  dislikes: number;
  /** `"like"`, `"dislike"`, or null when the reader has not reacted or is signed out. */
  myReaction: string | null;
  onToggle: (type: "like" | "dislike") => void;
  likeLabel: string;
  dislikeLabel: string;
}

export function ReactionButtons({
  likes,
  dislikes,
  myReaction,
  onToggle,
  likeLabel,
  dislikeLabel,
  size = "md",
}: ReactionButtonsProps) {
  const icon = ICON_SIZE[size ?? "md"];

  return (
    <div className="flex items-center gap-1">
      <Button
        variant="ghost"
        size="sm"
        aria-label={likeLabel}
        aria-pressed={myReaction === "like"}
        className={cn(
          reactionButton({ size }),
          myReaction === "like" && "text-foreground",
        )}
        onClick={() => onToggle("like")}
      >
        <Icons.ThumbsUp
          className={cn(icon, myReaction === "like" && "fill-current")}
        />
        <span className="num text-xs">{likes}</span>
      </Button>
      <Button
        variant="ghost"
        size="sm"
        aria-label={dislikeLabel}
        aria-pressed={myReaction === "dislike"}
        className={cn(
          reactionButton({ size }),
          myReaction === "dislike" && "text-foreground",
        )}
        onClick={() => onToggle("dislike")}
      >
        <Icons.ThumbsDown
          className={cn(icon, myReaction === "dislike" && "fill-current")}
        />
        <span className="num text-xs">{dislikes}</span>
      </Button>
    </div>
  );
}
