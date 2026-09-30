"use client";

import { useTranslations } from "next-intl";
import { Input } from "../../components/input";
import type { DrawPlayerView } from "./draw-view";
import { LadderPlayerRow } from "./ladder-player-row";

/** A long ladder would be a long page; the search narrows it past this many. */
const SHOWN = 80;

interface LadderPickerProps {
  /** Ladder players not on the roster yet, already filtered by the search. */
  players: DrawPlayerView[];
  search: string;
  onSearchChange: (search: string) => void;
  onAdd: (key: string) => void;
  /** The roster is full. */
  full: boolean;
}

/** Picks roster players from the ladder by name. */
export function LadderPicker({
  players,
  search,
  onSearchChange,
  onAdd,
  full,
}: LadderPickerProps) {
  const t = useTranslations("draw");

  return (
    <div>
      <h2 className="label-caps pb-3 text-foreground">{t("fromLadder")}</h2>
      <Input
        value={search}
        onChange={(event) => onSearchChange(event.target.value)}
        placeholder={t("searchPlaceholder")}
        aria-label={t("searchPlaceholder")}
      />
      <ul className="mt-2 max-h-72 divide-y overflow-y-auto">
        {players.length === 0 ? (
          <li className="py-4 text-sm text-muted-foreground">
            {search.trim() ? t("noSearchResults") : t("rosterHint")}
          </li>
        ) : (
          players
            .slice(0, SHOWN)
            .map((player) => (
              <LadderPlayerRow
                key={player.key}
                player={player}
                disabled={full}
                onAdd={() => onAdd(player.key)}
              />
            ))
        )}
      </ul>
    </div>
  );
}
