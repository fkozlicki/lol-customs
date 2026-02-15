"use client";

import type { RouterOutputs } from "@v1/api";
import { Button } from "@v1/ui/button";
import { cn } from "@v1/ui/cn";
import { Icons } from "@v1/ui/icons";
import { Separator } from "@v1/ui/separator";
import { formatDistanceToNow } from "date-fns";
import Image from "next/image";

const DD_CDN = "https://ddragon.leagueoflegends.com/cdn";

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
  return pl.tag_line ? `${pl.game_name}#${pl.tag_line}` : pl.game_name;
}

function matchTypeLabel(match: MatchWithParticipants["match"]): string {
  if (match.game_mode) return match.game_mode;
  if (match.queue_id != null) return `Queue ${match.queue_id}`;
  return "Custom";
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

  return (
    <div className="rounded-sm border-l-[6px] border-border bg-secondary/50 overflow-hidden">
      <div className="flex gap-6 px-3 py-1">
        {/* Match meta */}
        <div className="flex flex-col  shrink-0 min-w-[100px] justify-between">
          <div className="flex flex-col gap-0.5">
            <span className="text-muted-foreground text-xs font-semibold">
              {matchTypeLabel(match)}
            </span>
            <span className="text-muted-foreground text-xs">
              {formatDistanceToNow(match.game_creation, { addSuffix: true })}
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

        <div
          className={cn(
            "rounded px-2 py-1 text-sm font-medium self-center",
            blueWon
              ? "bg-blue-500/20 text-blue-700 dark:text-blue-300"
              : "bg-red-500/20 text-red-700 dark:text-red-300",
          )}
        >
          {blueWon ? "Blue victory" : "Red victory"}
        </div>

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

        {/* Expand */}
        <Button
          size="icon"
          variant="ghost"
          className="self-center ml-auto"
          onClick={onToggleExpand}
          aria-expanded={isExpanded}
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
