"use client";

import type { RouterOutputs } from "@v1/api";
import TeamTable from "./match-table";

export type MatchWithParticipants =
  RouterOutputs["matches"]["recentWithParticipants"][number];

export interface ChampionMap {
  [key: string]: { id: string; key: string; name: string; imageFull: string };
}

interface MatchDetailProps {
  entry: MatchWithParticipants;
  patch: string;
  championMap: ChampionMap;
}

export function MatchDetail({ entry, patch, championMap }: MatchDetailProps) {
  const { match, participants } = entry;
  const blueTeam = participants.filter((p) => p.team_id === 100);
  const redTeam = participants.filter((p) => p.team_id === 200);
  const durationMin = match.duration / 60;
  const blueKills = blueTeam.reduce((sum, p) => sum + (p.kills ?? 0), 0);
  const redKills = redTeam.reduce((sum, p) => sum + (p.kills ?? 0), 0);
  const blueGold = blueTeam.reduce((sum, p) => sum + (p.gold_earned ?? 0), 0);
  const redGold = redTeam.reduce((sum, p) => sum + (p.gold_earned ?? 0), 0);

  const highestDamageDealt = [...blueTeam, ...redTeam].reduce(
    (max, p) => Math.max(max, p.total_damage_dealt_to_champions ?? 0),
    0,
  );
  const highestDamageTaken = [...blueTeam, ...redTeam].reduce(
    (max, p) => Math.max(max, p.total_damage_taken ?? 0),
    0,
  );

  return (
    <div className="bg-muted/50 rounded-sm">
      <TeamTable
        teamName="Blue Team"
        team={blueTeam}
        championMap={championMap}
        patch={patch}
        isVictorious={true}
        highestDamageDealt={highestDamageDealt}
        highestDamageTaken={highestDamageTaken}
        totalKills={blueKills}
      />
      <TeamTable
        teamName="Red Team"
        team={redTeam}
        championMap={championMap}
        patch={patch}
        isVictorious={false}
        highestDamageDealt={highestDamageDealt}
        highestDamageTaken={highestDamageTaken}
        totalKills={redKills}
      />
    </div>
  );
}
