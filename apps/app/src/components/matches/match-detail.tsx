"use client";

import type { RouterOutputs } from "@v1/api";
import { Progress } from "@v1/ui/progress";
import Image from "next/image";
import TeamTable from "./match-table";

const MATCH_HISTORY_ICONS_BASE =
  "https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-match-history/global/default/";

const OBJECTIVE_ICONS = {
  baron: "baron-100.png",
  dragon: "dragon-100.png",
  herald: "herald-100.png",
  inhibitor: "inhibitor-100.png",
  tower: "tower-100.png",
} as const;

const OBJECTIVE_ICONS_RED = {
  baron: "baron-200.png",
  dragon: "dragon-200.png",
  herald: "herald-200.png",
  inhibitor: "inhibitor-200.png",
  tower: "tower-200.png",
} as const;

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
  const { match, participants, teams } = entry;
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
      />
      <div className="flex px-4 py-2 border-y gap-4">
        <div className="space-y-1">
          <div className="flex gap-2">
            <div className="flex items-center gap-1.5 text-xs">
              <Image
                src={`${MATCH_HISTORY_ICONS_BASE}${OBJECTIVE_ICONS.baron}`}
                alt=""
                width={16}
                height={16}
                className="shrink-0"
              />
              {blueTeam?.baron_kills ?? 0}
            </div>
            <div className="flex items-center gap-1.5 text-xs">
              <Image
                src={`${MATCH_HISTORY_ICONS_BASE}${OBJECTIVE_ICONS.dragon}`}
                alt=""
                width={16}
                height={16}
                className="shrink-0"
              />
              {blueTeam?.dragon_kills ?? 0}
            </div>
            <div className="flex items-center gap-1.5 text-xs">
              <Image
                src={`${MATCH_HISTORY_ICONS_BASE}${OBJECTIVE_ICONS.herald}`}
                alt=""
                width={16}
                height={16}
                className="shrink-0"
              />
              {blueTeam?.rift_herald_kills ?? 0}
            </div>
          </div>

          <div className="flex gap-2">
            <div className="flex items-center gap-1.5 text-xs">
              <Image
                src={`${MATCH_HISTORY_ICONS_BASE}${OBJECTIVE_ICONS.inhibitor}`}
                alt=""
                width={16}
                height={16}
                className="shrink-0"
              />
              {blueTeam?.inhibitor_kills ?? 0}
            </div>
            <div className="flex items-center gap-1.5 text-xs">
              <Image
                src={`${MATCH_HISTORY_ICONS_BASE}${OBJECTIVE_ICONS.tower}`}
                alt=""
                width={16}
                height={16}
                className="shrink-0"
              />
              {blueTeam?.tower_kills ?? 0}
            </div>
          </div>
        </div>

        <div className="flex-1 space-y-1">
          <div className="relative">
            <div className="absolute top-0 left-0 bottom-0 right-0 z-10 flex justify-between text-[11px] text-white font-semibold px-1">
              <span>{blueTeamKills}</span>
              <span>Total Kills</span>
              <span>{redTeamKills}</span>
            </div>
            <Progress
              value={(blueTeamKills / (blueTeamKills + redTeamKills)) * 100}
              className="w-full h-4 rounded-none [&>div]:bg-red-400 bg-blue-400"
            />
          </div>
          <div className="relative">
            <div className="absolute top-0 left-0 bottom-0 right-0 z-10 flex justify-between text-[11px] text-white font-semibold px-1">
              <span>{blueGold}</span>
              <span>Total Gold</span>
              <span>{totalGold}</span>
            </div>
            <Progress
              value={(blueGold / totalGold) * 100}
              className="w-full h-4 rounded-none [&>div]:bg-red-400 bg-blue-400"
            />
          </div>
        </div>

        <div className="space-y-1">
          <div className="flex gap-2">
            <div className="flex items-center gap-1.5 text-xs">
              <Image
                src={`${MATCH_HISTORY_ICONS_BASE}${OBJECTIVE_ICONS_RED.baron}`}
                alt=""
                width={16}
                height={16}
                className="shrink-0"
              />
              {redTeam?.baron_kills ?? 0}
            </div>
            <div className="flex items-center gap-1.5 text-xs">
              <Image
                src={`${MATCH_HISTORY_ICONS_BASE}${OBJECTIVE_ICONS_RED.dragon}`}
                alt=""
                width={16}
                height={16}
                className="shrink-0"
              />
              {redTeam?.dragon_kills ?? 0}
            </div>
            <div className="flex items-center gap-1.5 text-xs">
              <Image
                src={`${MATCH_HISTORY_ICONS_BASE}${OBJECTIVE_ICONS_RED.herald}`}
                alt=""
                width={16}
                height={16}
                className="shrink-0"
              />
              {redTeam?.rift_herald_kills ?? 0}
            </div>
          </div>

          <div className="flex gap-2 justify-end">
            <div className="flex items-center gap-1.5 text-xs">
              <Image
                src={`${MATCH_HISTORY_ICONS_BASE}${OBJECTIVE_ICONS_RED.inhibitor}`}
                alt=""
                width={16}
                height={16}
                className="shrink-0"
              />
              {redTeam?.inhibitor_kills ?? 0}
            </div>
            <div className="flex items-center gap-1.5 text-xs">
              <Image
                src={`${MATCH_HISTORY_ICONS_BASE}${OBJECTIVE_ICONS_RED.tower}`}
                alt=""
                width={16}
                height={16}
                className="shrink-0"
              />
              {redTeam?.tower_kills ?? 0}
            </div>
          </div>
        </div>
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
      />
    </div>
  );
}
