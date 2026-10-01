"use client";

import { useTranslations } from "next-intl";
import { RankTag } from "../rank-tag";
import type { BoughtPlayerView } from "./auction-room-view";

interface RosterSlotProps {
  /** The slot's number on the roster; the captain is 1. */
  position: number;
  /** The player in it; null while it is still to be bought. */
  player: BoughtPlayerView | null;
}

/** A place on a roster: the player bought for it and their price, or a line to fill. */
export function RosterSlot({ position, player }: RosterSlotProps) {
  const t = useTranslations("auctions.room");

  return (
    <li className="flex h-14 items-center gap-3">
      <span className="num w-4 shrink-0 text-xs text-muted-foreground">
        {position}
      </span>
      {player ? (
        <>
          <div className="min-w-0 flex-1">
            <span className="block truncate text-sm font-medium">
              {player.name}
            </span>
            <RankTag tier={player.rankTier}>
              {player.rankLabel ?? t("unranked")}
            </RankTag>
          </div>
          {player.price != null && (
            <span className="num shrink-0 text-sm">${player.price}</span>
          )}
        </>
      ) : (
        <span className="flex-1 border-b border-dashed" />
      )}
    </li>
  );
}
