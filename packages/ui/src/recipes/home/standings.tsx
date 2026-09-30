"use client";

import { useTranslations } from "next-intl";
import { SeasonPodium } from "./season-podium";
import { StandingsHero } from "./standings-hero";
import { StandingsTable } from "./standings-table";
import type { StandingsRowView } from "./standings-view";

interface StandingsProps {
  /** "Season 2", "All seasons". */
  seasonTitle: string;
  rows: StandingsRowView[];
  qualificationMatches: number;
  /** Replays the standings after N matches; shown above the table. */
  historyPicker?: React.ReactNode;
  /** Offered when the season has no matches yet, e.g. the Derby Sync download. */
  emptyAction?: React.ReactNode;
}

/** The home page: which standings, the podium, and the table of everyone on the track. */
export function Standings({
  seasonTitle,
  rows,
  qualificationMatches,
  historyPicker,
  emptyAction,
}: StandingsProps) {
  const t = useTranslations("standings");

  return (
    <div className="space-y-12 sm:space-y-16">
      <section className="space-y-8 sm:space-y-12">
        <StandingsHero seasonTitle={seasonTitle} />
        <SeasonPodium rows={rows} qualificationMatches={qualificationMatches} />
      </section>

      <section className="space-y-4">
        {historyPicker}
        {rows.length === 0 ? (
          <div className="flex flex-col items-start gap-4 border-t py-10">
            <p className="text-sm text-muted-foreground">{t("noMatchesYet")}</p>
            {emptyAction}
          </div>
        ) : (
          <StandingsTable
            rows={rows}
            qualificationMatches={qualificationMatches}
          />
        )}
      </section>
    </div>
  );
}
