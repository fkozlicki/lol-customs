"use client";

import { useTranslations } from "next-intl";
import { Button } from "../../components/button";
import { RankTag } from "../rank-tag";
import type { DrawPlayerView } from "./draw-view";

interface LadderPlayerRowProps {
  player: DrawPlayerView;
  /** The roster is full. */
  disabled: boolean;
  onAdd: () => void;
}

/** A ladder player who can join the roster. */
export function LadderPlayerRow({
  player,
  disabled,
  onAdd,
}: LadderPlayerRowProps) {
  const t = useTranslations("draw");

  return (
    <li className="flex h-12 items-center gap-3 pr-1">
      <span className="min-w-0 flex-1 truncate text-sm font-medium">
        {player.name}
      </span>
      <RankTag tier={player.rankTier}>
        {player.rankLabel ?? t("unranked")}
      </RankTag>
      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={disabled}
        onClick={onAdd}
      >
        {t("addPlayer")}
      </Button>
    </li>
  );
}
