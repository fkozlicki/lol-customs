"use client";

import { positionRoleIconUrl } from "@v1/game-assets/urls";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { RankTag } from "../rank-tag";
import type { DrawnPlayerView } from "./draw-view";

/** A player in a drawn team: their role's icon, their name (and captaincy) and rank. */
export function DrawnPlayerRow({ player }: { player: DrawnPlayerView }) {
  const t = useTranslations("draw");
  const role = t(`roles.${player.role}`);

  return (
    <li className="flex h-14 items-center gap-3">
      <Image
        src={positionRoleIconUrl(player.role)}
        alt={role}
        title={role}
        width={20}
        height={20}
        className="shrink-0 object-contain"
      />
      <span className="min-w-0 flex-1 truncate text-sm font-medium">
        {player.name}
        {player.isCaptain && (
          <span className="label-caps ml-2">{t("captain")}</span>
        )}
      </span>
      <RankTag tier={player.rankTier}>
        {player.rankLabel ?? t("unranked")}
      </RankTag>
    </li>
  );
}
