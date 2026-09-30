"use client";

import { useTranslations } from "next-intl";
import { Icons } from "../icons";
import { RankTag } from "../rank-tag";
import type { DrawPlayerView } from "./draw-view";

interface RosterPlayerRowProps {
  player: DrawPlayerView;
  onRemove: () => void;
}

/** A player on the roster, with their rank and a way to take them off it. */
export function RosterPlayerRow({ player, onRemove }: RosterPlayerRowProps) {
  const t = useTranslations("draw");

  return (
    <li className="flex h-12 items-center gap-3">
      <span className="min-w-0 flex-1 truncate text-sm font-medium">
        {player.name}
      </span>
      <RankTag tier={player.rankTier}>
        {player.rankLabel ?? t("unranked")}
      </RankTag>
      <button
        type="button"
        onClick={onRemove}
        aria-label={t("removePlayer")}
        className="text-muted-foreground transition-colors hover:text-foreground"
      >
        <Icons.X className="size-4" />
      </button>
    </li>
  );
}
