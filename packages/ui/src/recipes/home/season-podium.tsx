"use client";

import { useTranslations } from "next-intl";
import { PodiumPlace } from "./podium-place";
import type { StandingsRowView } from "./standings-view";

/** Visual order on the podium: second, first, third. */
const PODIUM_ORDER = [1, 0, 2] as const;

interface SeasonPodiumProps {
  /** The standings in order; the first three with a position stand on the podium. */
  rows: StandingsRowView[];
  /** How many matches qualify a player, for the note while a step is still empty. */
  qualificationMatches: number;
}

/** The season's top three on a podium, second-first-third, with a note while a step is empty. */
export function SeasonPodium({
  rows,
  qualificationMatches,
}: SeasonPodiumProps) {
  const t = useTranslations("standings");
  const podium = rows.filter((row) => row.position != null).slice(0, 3);

  return (
    <div>
      <div className="grid grid-cols-3 items-end gap-2 sm:gap-4">
        {PODIUM_ORDER.map((place) => (
          <PodiumPlace key={place} place={place} row={podium[place]} />
        ))}
      </div>
      {podium.length < 3 && (
        <div className="mt-4 flex flex-col gap-1 sm:flex-row sm:items-baseline sm:gap-3">
          <span className="label-caps text-foreground">
            {t("podiumQualifying")}
          </span>
          <span className="text-sm text-muted-foreground">
            {t("podiumQualifyingHint", { count: qualificationMatches })}
          </span>
        </div>
      )}
    </div>
  );
}
