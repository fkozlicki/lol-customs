"use client";

import { useTranslations } from "next-intl";
import { Icons } from "../icons";
import { RankTag } from "../rank-tag";
import type { PickablePlayerView } from "./pickable-player-view";

interface PickedPlayerRowProps {
  player: PickablePlayerView;
  /** The remove button's accessible name. */
  removeLabel: string;
  onRemove: () => void;
}

/** A picked player, with their rank and a way to take them off again. */
export function PickedPlayerRow({
  player,
  removeLabel,
  onRemove,
}: PickedPlayerRowProps) {
  const t = useTranslations("player");

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
        aria-label={removeLabel}
        className="text-muted-foreground transition-colors hover:text-foreground"
      >
        <Icons.X className="size-4" />
      </button>
    </li>
  );
}
