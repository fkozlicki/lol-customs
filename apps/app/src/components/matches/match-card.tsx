"use client";

import type { RouterOutputs } from "@v1/api";
import { Button } from "@v1/ui/button";
import { cn } from "@v1/ui/cn";
import { Icons } from "@v1/ui/icons";
import { AverageRank } from "./average-rank";
import { MatchMetadata } from "./match-metadata";
import { MatchResult } from "./match-result";
import MatchTeam from "./match-team";
import { MVPPlayer } from "./mvp-player";

type Match = RouterOutputs["matches"]["list"][number];

type MatchParticipant = Match["match_participants"][number];
interface ChampionMap {
  [key: string]: { id: string; key: string; name: string; imageFull: string };
}

const RANK_TIER_ORDER = [
  "IRON",
  "BRONZE",
  "SILVER",
  "GOLD",
  "PLATINUM",
  "EMERALD",
  "DIAMOND",
  "MASTER",
  "GRANDMASTER",
  "CHALLENGER",
] as const;
const RANK_DIVISION_ORDER = ["IV", "III", "II", "I"] as const;

function rankToNumeric(
  tier: string | null,
  division: string | null,
): number | null {
  if (!tier) return null;
  const tierUpper = tier.toUpperCase();
  const tierIdx = RANK_TIER_ORDER.indexOf(
    tierUpper as (typeof RANK_TIER_ORDER)[number],
  );
  if (tierIdx === -1) return null;
  const isApex =
    tierUpper === "MASTER" ||
    tierUpper === "GRANDMASTER" ||
    tierUpper === "CHALLENGER";
  if (isApex) {
    return tierIdx * 4 + 3;
  }
  const divUpper = (division ?? "IV").toUpperCase();
  const divIdx = RANK_DIVISION_ORDER.indexOf(
    divUpper as (typeof RANK_DIVISION_ORDER)[number],
  );
  const divNum = divIdx === -1 ? 0 : divIdx;
  return tierIdx * 4 + divNum;
}

function numericToRank(n: number): { tier: string; division: string } {
  const tierIdx = Math.min(Math.floor(n / 4), RANK_TIER_ORDER.length - 1);
  const tier = RANK_TIER_ORDER[tierIdx];
  const isApex =
    tier === "MASTER" || tier === "GRANDMASTER" || tier === "CHALLENGER";
  const div = RANK_DIVISION_ORDER[Math.round(n % 4) % 4];
  const division: string = isApex ? "I" : (div ?? "IV");
  return { tier, division } as { tier: string; division: string };
}

function averageGameRank(participants: MatchParticipant[]): string {
  const values = participants
    .map((p) => rankToNumeric(p.rank_tier, p.rank_division))
    .filter((v): v is number => v != null);
  if (values.length === 0) return "—";
  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  const { tier, division } = numericToRank(avg);
  const divLabel =
    tier === "MASTER" || tier === "GRANDMASTER" || tier === "CHALLENGER"
      ? ""
      : ` ${division}`;
  return `${tier.toLowerCase()}${divLabel}`.trim();
}

interface MatchCardProps {
  match: Match;
  patch: string;
  championMap: ChampionMap;
  isExpanded: boolean;
  onToggleExpand: () => void;
}

export function MatchCard({
  match,
  patch,
  championMap,
  isExpanded,
  onToggleExpand,
}: MatchCardProps) {
  const participants = match.match_participants ?? [];
  const blueTeam = participants.filter((t) => t.team_id === 100);
  const redTeam = participants.filter((t) => t.team_id === 200);
  const blueWon = blueTeam[0]?.win === true;
  const avgRank = averageGameRank(match.match_participants ?? []);
  const participantWithMVP = participants.find((p) => p.is_mvp);
  const mvpChampion = participantWithMVP
    ? championMap[String(participantWithMVP.champion_id)]
    : null;

  return (
    <div className="rounded-sm border-l-[6px] border-border bg-secondary/50 overflow-hidden flex items-stretch">
      <div className="flex px-3 py-1 flex-1">
        {/* Match meta */}
        <MatchMetadata match={match} />

        <div className="flex justify-evenly items-center flex-1">
          {/* Match result - Red/Blue <Won> or <Lost> */}
          <div className="flex flex-col gap-2">
            <MatchResult blueWon={blueWon} />
            <AverageRank rank={avgRank} />
          </div>

          <MVPPlayer
            champion={mvpChampion}
            participant={participantWithMVP}
            patch={patch}
          />
        </div>

        <div className="flex items-center gap-4">
          {/* Blue team */}
          <MatchTeam
            team={blueTeam}
            championMap={championMap}
            patch={patch}
            teamName="blue"
          />

          {/* vs */}
          <span className="text-muted-foreground text-xs font-medium shrink-0 hidden sm:inline self-center">
            vs
          </span>

          {/* Red team */}
          <MatchTeam
            team={redTeam}
            championMap={championMap}
            patch={patch}
            teamName="red"
          />
        </div>
      </div>
      {/* Expand */}
      <div>
        <Button
          size="icon"
          variant="ghost"
          className="h-full min-h-full rounded-none"
          onClick={onToggleExpand}
          aria-label={
            isExpanded ? "Collapse match details" : "Expand match details"
          }
        >
          <Icons.ChevronDown
            className={cn(
              "h-5 w-5 transition-transform",
              isExpanded && "rotate-180",
            )}
          />
        </Button>
      </div>
    </div>
  );
}
