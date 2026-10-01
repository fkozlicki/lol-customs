import type { ReactNode } from "react";

interface PlayerSeasonOverviewProps {
  /** Which season this is, e.g. "Season 2" or "All time". */
  label: string;
  titles: ReactNode;
  stats: ReactNode;
  chart: ReactNode;
}

/** A player's season at a glance: the titles they hold, their numbers, and their rating over time. */
export function PlayerSeasonOverview({
  label,
  titles,
  stats,
  chart,
}: PlayerSeasonOverviewProps) {
  return (
    <div className="space-y-10">
      <div className="space-y-3">
        <p className="label-caps">{label}</p>
        {titles}
        {stats}
      </div>
      {chart}
    </div>
  );
}
