"use client";

import { useTranslations } from "next-intl";
import type { DrawPlayerView } from "./draw-view";
import { RosterPlayerRow } from "./roster-player-row";

interface DrawRosterProps {
  roster: DrawPlayerView[];
  onRemove: (key: string) => void;
}

/** The ten players the draw will split, as they are added. */
export function DrawRoster({ roster, onRemove }: DrawRosterProps) {
  const t = useTranslations("draw");

  return (
    <section>
      <h2 className="label-caps pb-3 text-foreground">{t("rosterTitle")}</h2>
      {roster.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("rosterHint")}</p>
      ) : (
        <ul className="divide-y">
          {roster.map((player) => (
            <RosterPlayerRow
              key={player.key}
              player={player}
              onRemove={() => onRemove(player.key)}
            />
          ))}
        </ul>
      )}
    </section>
  );
}
