"use client";

import { useTranslations } from "next-intl";
import LeaderboardRow from "./leaderboard-row";
import { QualifyingHeading } from "./qualifying-heading";
import { StandingsColumnHeading as Th } from "./standings-column-heading";
import type { StandingsRowView } from "./standings-view";

interface StandingsTableProps {
  /** The standings in order: ranked players, then those still qualifying. */
  rows: StandingsRowView[];
  qualificationMatches: number;
}

/** Every player on the track: the ranked ones by position, then the qualifying ones below a divider. */
export function StandingsTable({
  rows,
  qualificationMatches,
}: StandingsTableProps) {
  const t = useTranslations("standings");
  const ranked = rows.filter((row) => row.position != null);
  const qualifying = rows.filter((row) => row.position == null);

  return (
    <div className="-mx-4 overflow-x-auto sm:mx-0">
      <table className="w-full min-w-[20rem] border-collapse text-sm">
        <thead>
          <tr className="border-b text-left">
            <Th className="w-12 pl-4 sm:pl-0">#</Th>
            <Th>{t("tablePlayer")}</Th>
            <Th className="text-right">{t("tableRating")}</Th>
            <Th className="text-right">{t("tableWr")}</Th>
            <Th className="hidden text-right sm:table-cell">
              {t("tableMatches")}
            </Th>
            <Th className="hidden text-right md:table-cell">{t("tableKda")}</Th>
            <Th className="hidden text-right md:table-cell">{t("tableMvp")}</Th>
            <Th className="hidden text-right md:table-cell">{t("tableAce")}</Th>
            <Th className="hidden pr-4 text-right sm:table-cell sm:pr-0">
              {t("tableStreak")}
            </Th>
          </tr>
        </thead>
        <tbody>
          {ranked.map((row, index) => (
            <LeaderboardRow
              key={row.key}
              row={row}
              index={index}
              qualificationMatches={qualificationMatches}
            />
          ))}
          {qualifying.length > 0 && (
            <QualifyingHeading qualificationMatches={qualificationMatches} />
          )}
          {qualifying.map((row, index) => (
            <LeaderboardRow
              key={row.key}
              row={row}
              index={ranked.length + index}
              qualificationMatches={qualificationMatches}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
