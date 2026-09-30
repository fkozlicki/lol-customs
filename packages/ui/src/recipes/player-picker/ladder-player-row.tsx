"use client";

import { useTranslations } from "next-intl";
import { Button } from "../../components/button";
import { RankTag } from "../rank-tag";
import type { PickablePlayerView } from "./pickable-player-view";

interface LadderPlayerRowProps {
  player: PickablePlayerView;
  addLabel: string;
  /** Nothing more can be picked. */
  disabled: boolean;
  onAdd: () => void;
}

/** A ladder player who can be picked. */
export function LadderPlayerRow({
  player,
  addLabel,
  disabled,
  onAdd,
}: LadderPlayerRowProps) {
  const t = useTranslations("player");

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
        {addLabel}
      </Button>
    </li>
  );
}
