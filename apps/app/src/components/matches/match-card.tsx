"use client";

import type { RouterOutputs } from "@v1/api";
import { Button } from "@v1/ui/button";
import { cn } from "@v1/ui/cn";
import { Icons } from "@v1/ui/icons";
import { Separator } from "@v1/ui/separator";
import { formatDistanceToNowStrict } from "date-fns";
import Image from "next/image";

const DD_CDN = "https://ddragon.leagueoflegends.com/cdn";
const RANK_CRESTS_BASE =
  "https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-static-assets/global/default/images/ranked-mini-crests/";
const RANK_TIERS_CREST = new Set([
  "iron",
  "bronze",
  "silver",
  "gold",
  "platinum",
  "emerald",
  "diamond",
  "master",
  "grandmaster",
  "challenger",
]);

type MatchWithParticipants =
  RouterOutputs["matches"]["recentWithParticipants"][number];
type Participant = MatchWithParticipants["participants"][number];

interface ChampionMap {
  [key: string]: { id: string; key: string; name: string; imageFull: string };
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s}s`;
}

function playerDisplayName(p: Participant): string {
  const pl = p.players as {
    game_name: string | null;
    tag_line: string | null;
  } | null;
  if (!pl?.game_name) return "—";
  return pl.game_name;
}

function matchTypeLabel(match: MatchWithParticipants["match"]): string {
  if (match.game_mode) return match.game_mode;
  if (match.queue_id != null) return `Queue ${match.queue_id}`;
  return "Custom";
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

function averageGameRank(participants: Participant[]): string {
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

function averageRankCrestUrl(avgRankLabel: string): string {
  if (avgRankLabel === "—") return `${RANK_CRESTS_BASE}unranked.svg`;
  const tier = avgRankLabel.split(" ")[0]?.toLowerCase() ?? "";
  return RANK_TIERS_CREST.has(tier)
    ? `${RANK_CRESTS_BASE}${tier}.svg`
    : `${RANK_CRESTS_BASE}unranked.svg`;
}

interface MatchCardProps {
  entry: MatchWithParticipants;
  patch: string;
  championMap: ChampionMap;
  isExpanded: boolean;
  onToggleExpand: () => void;
}

export function MatchCard({
  entry,
  patch,
  championMap,
  isExpanded,
  onToggleExpand,
}: MatchCardProps) {
  const { match, participants } = entry;
  const blueTeam = participants.filter((p) => p.team_id === 100);
  const redTeam = participants.filter((p) => p.team_id === 200);
  const blueWon = blueTeam[0]?.win === true;
  const avgRank = averageGameRank(participants);

  return (
    <div className="rounded-sm border-l-[6px] border-border bg-secondary/50 overflow-hidden flex items-stretch">
      <div className="flex gap-6 px-3 py-1 flex-1">
        {/* Match meta */}
        <div className="flex flex-col  shrink-0 min-w-[100px] justify-between">
          <div className="flex flex-col gap-0.5">
            <span className="text-muted-foreground text-xs font-semibold">
              {matchTypeLabel(match)}
            </span>
            <span className="text-muted-foreground text-xs">
              {formatDistanceToNowStrict(match.game_creation, {
                addSuffix: true,
              })}
            </span>
          </div>
          <Separator className="my-1" />
          <div className="flex flex-col gap-0.5">
            <span className="font-medium text-sm">
              {formatDuration(match.duration)}
            </span>
            {match.patch && (
              <span className="text-muted-foreground text-xs">
                Patch {match.patch.split(".").slice(0, 2).join(".")}
              </span>
            )}
          </div>
        </div>

        {/* Match result - Red/Blue <Won> or <Lost> */}

        <div className="flex flex-col gap-2 self-center">
          <div
            className={cn(
              "rounded px-2 py-1 text-sm font-medium ",
              blueWon
                ? "bg-blue-500/20 text-blue-700 dark:text-blue-300"
                : "bg-red-500/20 text-red-700 dark:text-red-300",
            )}
          >
            {blueWon ? "Blue victory" : "Red victory"}
          </div>

          <div className="">
            <span className="text-muted-foreground text-xs">Avg rank:</span>
            <div className="flex items-center gap-0.5">
              <Image
                src={averageRankCrestUrl(avgRank)}
                alt=""
                width={16}
                height={16}
                className="rounded-sm shrink-0 object-cover"
              />
              <span className="text-xs capitalize">{avgRank}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 ml-auto">
          {/* Blue team */}
          <div className="flex flex-col gap-0.5 shrink-0">
            <span className="text-[10px] font-medium uppercase text-blue-700">
              blue
            </span>
            <div className="flex flex-col gap-0.5">
              {blueTeam.slice(0, 5).map((p) => {
                const ch =
                  p.champion_id != null
                    ? championMap[String(p.champion_id)]
                    : null;
                return (
                  <div
                    key={p.puuid}
                    className="flex items-center gap-1.5 truncate max-w-[140px]"
                  >
                    {ch ? (
                      <Image
                        src={`${DD_CDN}/${patch}/img/champion/${ch.imageFull}`}
                        alt=""
                        width={16}
                        height={16}
                        className="rounded-sm shrink-0 object-cover"
                      />
                    ) : (
                      <div className="h-5 w-5 rounded-full bg-muted shrink-0" />
                    )}
                    <span className="truncate text-xs">
                      {playerDisplayName(p)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* vs */}
          <span className="text-muted-foreground text-xs font-medium shrink-0 hidden sm:inline self-center">
            vs
          </span>

          {/* Red team */}
          <div className="flex flex-col gap-0.5 shrink-0">
            <span className="text-[10px] font-medium uppercase text-red-700">
              red
            </span>
            <div className="flex flex-col gap-0.5">
              {redTeam.slice(0, 5).map((p) => {
                const ch =
                  p.champion_id != null
                    ? championMap[String(p.champion_id)]
                    : null;
                return (
                  <div
                    key={p.puuid}
                    className="flex items-center gap-1.5 truncate max-w-[140px]"
                  >
                    {ch ? (
                      <Image
                        src={`${DD_CDN}/${patch}/img/champion/${ch.imageFull}`}
                        alt=""
                        width={16}
                        height={16}
                        className="rounded-sm shrink-0 object-cover"
                      />
                    ) : (
                      <div className="h-5 w-5 rounded-full bg-muted shrink-0" />
                    )}
                    <span className="truncate text-xs">
                      {playerDisplayName(p)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
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
