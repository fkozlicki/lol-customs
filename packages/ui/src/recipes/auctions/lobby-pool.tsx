"use client";

import { useTranslations } from "next-intl";
import { RankTag } from "../rank-tag";
import type { AuctionPlayerView } from "./auction-room-view";

interface LobbyPoolProps {
  players: AuctionPlayerView[];
  /** Opens the pool for editing; only the creator may, before the countdown. */
  onEdit?: () => void;
}

/** The eight players the room will sell. */
export function LobbyPool({ players, onEdit }: LobbyPoolProps) {
  const t = useTranslations("auctions");

  return (
    <section>
      <div className="flex items-baseline justify-between gap-4 border-b pb-3">
        <h2 className="label-caps text-foreground">{t("creator.pool")}</h2>
        {onEdit && (
          <button
            type="button"
            onClick={onEdit}
            className="label-caps underline-offset-4 hover:text-foreground hover:underline"
          >
            {t("lobby.edit")}
          </button>
        )}
      </div>
      <ul className="grid gap-x-12 sm:grid-cols-2">
        {players.map((player) => (
          <li key={player.id} className="flex h-12 items-center gap-3 border-b">
            <span className="min-w-0 flex-1 truncate text-sm font-medium">
              {player.name}
            </span>
            <RankTag tier={player.rankTier}>
              {player.rankLabel ?? t("room.unranked")}
            </RankTag>
          </li>
        ))}
      </ul>
    </section>
  );
}
