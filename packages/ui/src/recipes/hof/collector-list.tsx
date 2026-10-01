import Link from "next/link";
import { cn } from "../../utils/cn";
import { ProfileIcon } from "../game-assets/profile-icon";
import type { CollectorView } from "./hall-of-fame-view";
import { TitlePip } from "./title-pip";

/** Beyond this many titles the pips stop; the number beside them keeps counting. */
const MAX_PIPS = 12;

interface CollectorListProps {
  label: string;
  rows: CollectorView[];
  /** Best titles draw filled pips; worst ones, outlined. */
  filled?: boolean;
  className?: string;
}

/** The players holding the most titles of one kind, with a pip per title. */
export function CollectorList({
  label,
  rows,
  filled = false,
  className,
}: CollectorListProps) {
  return (
    <section className={cn("w-full md:max-w-md", className)}>
      <h2 className="pb-2 text-lg font-semibold uppercase leading-none tracking-[-0.02em] sm:text-xl">
        {label}
      </h2>
      <ol>
        {rows.map(({ player, titles }) => (
          <li key={player.key}>
            <Link
              href={player.href}
              className="group flex h-11 items-center gap-3"
            >
              <ProfileIcon
                iconId={player.iconId}
                name={player.name}
                fallbackChars={1}
                avatarClassName="size-7 rounded-none"
                fallbackClassName="rounded-none text-xs"
              />
              <span className="min-w-0 flex-1 truncate text-sm font-medium underline-offset-4 group-hover:underline">
                {player.name}
              </span>
              <span className="flex w-28 shrink-0 items-center gap-0.5">
                {Array.from({ length: Math.min(titles, MAX_PIPS) }, (_, i) => (
                  <TitlePip key={i} filled={filled} />
                ))}
              </span>
              <span className="num w-6 shrink-0 text-right text-sm font-semibold">
                {titles}
              </span>
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
}
