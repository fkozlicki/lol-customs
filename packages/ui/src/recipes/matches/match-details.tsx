"use client";

import { MatchStats } from "./match-stats";
import type { MatchCardView } from "./match-view";
import { TeamObjectives } from "./team-objectives";
import TeamTable from "./team-table";

/**
 * The scoreboard under an expanded card: both sides, and between them the objectives and the kill
 * and gold bars.
 */
export default function MatchDetails({ match }: { match: MatchCardView }) {
  const { blue, red } = match;

  return (
    <div className="border border-t-0 bg-card">
      <TeamTable team={blue} />
      <div className="flex flex-col gap-4 border-y px-4 py-3 sm:flex-row sm:items-center">
        <TeamObjectives {...blue.objectives} teamName="blue" />
        <MatchStats
          blueKills={blue.kills}
          redKills={red.kills}
          blueGold={blue.gold}
          redGold={red.gold}
        />
        <TeamObjectives {...red.objectives} teamName="red" align="right" />
      </div>
      <TeamTable team={red} />
    </div>
  );
}
