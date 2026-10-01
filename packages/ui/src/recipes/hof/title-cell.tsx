"use client";

import { useTranslations } from "next-intl";
import { Fragment } from "react";
import { cn } from "../../utils/cn";
import { ProfileIcon } from "../game-assets/profile-icon";
import type { TitleView } from "./hall-of-fame-view";
import { HofPlayerLink } from "./hof-player-link";

interface TitleCellProps {
  title: TitleView;
  className?: string;
}

/**
 * One title: its name, the holders' faces and names (all of them from `sm`, the first and a count on
 * phones), and the record on the right with what it measures.
 */
export function TitleCell({ title, className }: TitleCellProps) {
  const t = useTranslations("hallOfFame");
  const [holder] = title.holders;
  const toneClass =
    title.tone === "mvp"
      ? "text-mvp"
      : title.tone === "ace"
        ? "text-ace"
        : null;

  return (
    <div
      className={cn(
        "flex w-full min-w-0 items-center gap-4 py-4 md:max-w-md",
        className,
      )}
    >
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <span className={cn("label-caps text-foreground", toneClass)}>
          {title.title}
        </span>
        {holder ? (
          <div className="flex min-w-0 items-center gap-2">
            <div className="flex shrink-0 -space-x-1.5">
              {title.holders.slice(0, 3).map((player) => (
                <ProfileIcon
                  key={player.key}
                  iconId={player.iconId}
                  name={player.name}
                  fallbackChars={1}
                  avatarClassName="size-6 rounded-none ring-2 ring-background sm:size-7"
                  fallbackClassName="rounded-none text-[10px]"
                />
              ))}
            </div>
            <span className="min-w-0 truncate text-sm font-medium sm:hidden">
              <HofPlayerLink player={holder} />
              {title.holders.length > 1 && (
                <span className="num text-muted-foreground">
                  {" "}
                  +{title.holders.length - 1}
                </span>
              )}
            </span>
            <span className="hidden min-w-0 truncate text-sm font-medium sm:inline">
              {title.holders.map((player, index) => (
                <Fragment key={player.key}>
                  {index > 0 && ", "}
                  <HofPlayerLink player={player} />
                </Fragment>
              ))}
            </span>
          </div>
        ) : (
          <span className="text-sm text-muted-foreground">{t("noHolder")}</span>
        )}
      </div>

      {holder && title.value != null && (
        <div className="flex shrink-0 flex-col items-end">
          <span
            className={cn(
              "num text-xl font-semibold leading-none sm:text-2xl",
              toneClass,
            )}
          >
            {title.value}
          </span>
          <span className="label-caps mt-1 text-[10px]">{title.statLabel}</span>
        </div>
      )}
    </div>
  );
}
