"use client";

import { MatchStats } from "./match-stats";
import type { MatchCardView } from "./match-view";
import { SideObjectives } from "./side-objectives";
import SideTable from "./side-table";

/**
 * The scoreboard under an expanded card: both sides, and between them the objectives and the kill
 * and gold bars.
 */
export default function MatchDetails({ match }: { match: MatchCardView }) {
  const { blue, red } = match;

  return (
    <div className="border border-t-0 bg-card">
      <SideTable side={blue} />
      <div className="flex flex-col gap-4 border-y px-4 py-3 sm:flex-row sm:items-center">
        <SideObjectives {...blue.objectives} side="blue" />
        <MatchStats
          blueKills={blue.kills}
          redKills={red.kills}
          blueGold={blue.gold}
          redGold={red.gold}
        />
        <SideObjectives {...red.objectives} side="red" align="right" />
      </div>
      <SideTable side={red} />
    </div>
  );
}
