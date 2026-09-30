import Link from "next/link";
import { cn } from "../../utils/cn";
import type { HeldTitleView } from "./player-view";

/** Hall of Fame titles the player currently holds on the selected track. */
export function PlayerTitles({ titles }: { titles: HeldTitleView[] }) {
  if (titles.length === 0) return null;

  return (
    <ul className="flex flex-wrap gap-1.5">
      {titles.map((title) => (
        <li key={title.id}>
          <Link
            href={title.href}
            title={title.description}
            className={cn(
              "flex items-center gap-2 border px-2 py-1 transition-colors hover:bg-muted",
              title.kind === "worst" && "border-dashed",
            )}
          >
            <span
              className={cn(
                "label-caps text-foreground",
                title.tone === "mvp" && "text-mvp",
                title.tone === "ace" && "text-ace",
              )}
            >
              {title.title}
            </span>
            <span className="num text-xs text-muted-foreground">
              {title.value}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
