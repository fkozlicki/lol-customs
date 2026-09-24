import { Avatar, AvatarFallback, AvatarImage } from "@v1/ui/avatar";
import { cn } from "@v1/ui/cn";
import { RelativeTime } from "@/components/relative-time";

/**
 * Who wrote it and when: the line above a post, a post card and a comment.
 *
 * Written three times, identical apart from the avatar, which is a step larger on a post than in a
 * list. Not built on `ProfileIcon` — that one takes a Riot profile-icon id and builds a Data Dragon
 * URL, where a forum author has an uploaded avatar and a nickname.
 *
 * `rounded-none` appears three times in here because shadcn's `Avatar` hardcodes `rounded-full`;
 * DESIGN.md rule 4 makes avatars square. One place to say it instead of nine.
 */
interface AuthorLineProps {
  /** Already resolved by the caller, so this stays out of the locale files. */
  name: string;
  avatarUrl: string | null | undefined;
  date: string;
  /** `md` on a post, `sm` in a list or a comment thread. */
  size?: "sm" | "md";
  className?: string;
}

export function AuthorLine({
  name,
  avatarUrl,
  date,
  size = "sm",
  className,
}: AuthorLineProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Avatar
        className={cn(
          "shrink-0 rounded-none",
          size === "md" ? "size-6" : "size-5",
        )}
      >
        <AvatarImage src={avatarUrl ?? undefined} className="rounded-none" />
        <AvatarFallback className="rounded-none text-[10px] font-semibold">
          {name[0]?.toUpperCase() ?? "?"}
        </AvatarFallback>
      </Avatar>
      <span className="label-caps text-foreground">{name}</span>
      <RelativeTime date={date} className="label-caps" />
    </div>
  );
}
