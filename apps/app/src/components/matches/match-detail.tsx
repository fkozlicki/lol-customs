"use client";

import type { ChampionMap, Match } from "./match-history-list";
import { MatchStats } from "./match-stats";
import TeamTable from "./match-table";
import { TeamObjectives } from "./team-objectives";

interface MatchDetailProps {
  match: Match;
  patch: string;
  championMap: ChampionMap;
}

export default function MatchDetail({
  match,
  patch,
  championMap,
}: MatchDetailProps) {
  const participants = match.match_participants ?? [];
  const teams = match.teams ?? [];
  const blueTeamParticipants = participants.filter((p) => p.team_id === 100);
  const redTeamParticipants = participants.filter((p) => p.team_id === 200);
  const blueKills = blueTeamParticipants.reduce(
    (sum, p) => sum + (p.kills ?? 0),
    0,
  );
  const redKills = redTeamParticipants.reduce(
    (sum, p) => sum + (p.kills ?? 0),
    0,
  );
  const blueGold = blueTeamParticipants.reduce(
    (sum, p) => sum + (p.gold_earned ?? 0),
    0,
  );
  const redGold = redTeamParticipants.reduce(
    (sum, p) => sum + (p.gold_earned ?? 0),
    0,
  );
  const totalGold = blueGold + redGold;
  const blueTeam = teams.find((t) => t.team_id === 100);
  const redTeam = teams.find((t) => t.team_id === 200);

  const highestDamageDealt = [
    ...blueTeamParticipants,
    ...redTeamParticipants,
  ].reduce(
    (max, p) => Math.max(max, p.total_damage_dealt_to_champions ?? 0),
    0,
  );
  const highestDamageTaken = [
    ...blueTeamParticipants,
    ...redTeamParticipants,
  ].reduce((max, p) => Math.max(max, p.total_damage_taken ?? 0), 0);

  const blueTeamKills = blueTeamParticipants.reduce(
    (sum, p) => sum + (p.kills ?? 0),
    0,
  );
  const redTeamKills = redTeamParticipants.reduce(
    (sum, p) => sum + (p.kills ?? 0),
    0,
  );

  const scores = participants
    .map((p) => p.op_score)
    .filter((opScore): opScore is number => opScore != null)
    .sort((a, b) => b - a);

  return (
    <div className="bg-muted/50 rounded-sm">
      <TeamTable
        teamName="Blue Team"
        team={blueTeamParticipants}
        championMap={championMap}
        patch={patch}
        isVictorious={blueTeam?.win ?? false}
        highestDamageDealt={highestDamageDealt}
        highestDamageTaken={highestDamageTaken}
        totalKills={blueKills}
        duration={match.duration}
        rawJson={match.raw_json}
        scores={scores}
      />
      <div className="flex px-4 py-2 border-y gap-4">
        <TeamObjectives
          baronKills={blueTeam?.baron_kills ?? 0}
          dragonKills={blueTeam?.dragon_kills ?? 0}
          heraldKills={blueTeam?.rift_herald_kills ?? 0}
          inhibitorKills={blueTeam?.inhibitor_kills ?? 0}
          towerKills={blueTeam?.tower_kills ?? 0}
          teamName="blue"
        />

        <MatchStats
          blueTeamKills={blueTeamKills}
          redTeamKills={redTeamKills}
          blueGold={blueGold}
          totalGold={totalGold}
        />

        <TeamObjectives
          baronKills={redTeam?.baron_kills ?? 0}
          dragonKills={redTeam?.dragon_kills ?? 0}
          heraldKills={redTeam?.rift_herald_kills ?? 0}
          inhibitorKills={redTeam?.inhibitor_kills ?? 0}
          towerKills={redTeam?.tower_kills ?? 0}
          teamName="red"
          align="right"
        />
      </div>
      <TeamTable
        teamName="Red Team"
        team={redTeamParticipants}
        championMap={championMap}
        patch={patch}
        isVictorious={redTeam?.win ?? false}
        highestDamageDealt={highestDamageDealt}
        highestDamageTaken={highestDamageTaken}
        totalKills={redKills}
        duration={match.duration}
        rawJson={match.raw_json}
        scores={scores}
      />
    </div>
  );
}
