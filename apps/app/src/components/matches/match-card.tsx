"use client";

import { Button } from "@v1/ui/button";
import { cn } from "@v1/ui/cn";
import { Icons } from "@v1/ui/icons";
import { AverageRank } from "./average-rank";
import type { Match, RawJson } from "./match-history-list";
import { MatchMetadata } from "./match-metadata";
import { MatchResult } from "./match-result";
import MatchTeam from "./match-team";
import { MVPPlayer } from "./mvp-player";
import { PlayerMetadata } from "./player-metadata";

interface MatchCardProps {
  match: Match;
  isExpanded: boolean;
  onToggleExpand: () => void;
  puuid?: string;
}

export default function MatchCard({
  match,
  isExpanded,
  onToggleExpand,
  puuid,
}: MatchCardProps) {
  const participants = match.match_participants ?? [];
  const rawParticipants = (match.raw_json as unknown as RawJson).participants;
  const blueTeamParticipants = participants.filter((t) => t.team_id === 100);
  const redTeamParticipants = participants.filter((t) => t.team_id === 200);
  const blueWon = blueTeamParticipants[0]?.win === true;
  const participantWithMVP = participants.find((p) => p.is_mvp);
  const scores = participants
    .map((p) => p.op_score)
    .filter((opScore): opScore is number => opScore != null)
    .sort((a, b) => b - a);

  const playerParticipant = participants.find((p) => p.puuid === puuid);
  const hasWon = playerParticipant?.win === true;
  const rawData = rawParticipants.find(
    (par) => par.participantId === playerParticipant?.participant_id,
  );
  const participantTeamId = playerParticipant?.team_id;

  const participantTeam =
    participantTeamId === 100 ? blueTeamParticipants : redTeamParticipants;
  const totalKills = participantTeam.reduce(
    (acc, p) => acc + (p.kills ?? 0),
    0,
  );

  return (
    <div
      className={cn(
        "rounded-sm border-l-[6px] border-border bg-secondary/50 overflow-hidden flex items-stretch",
        playerParticipant && {
          "border-blue-600/80 bg-blue-600/10 dark:border-blue-400/80 dark:bg-blue-400/20":
            hasWon,
          "border-red-500/80 bg-red-500/10 dark:border-red-400/80 dark:bg-red-400/10":
            !hasWon,
        },
      )}
    >
      <div className="flex px-3 py-1 flex-1">
        <MatchMetadata match={match} />

        {playerParticipant ? (
          <PlayerMetadata
            participant={playerParticipant}
            rawData={rawData}
            scores={scores}
            totalKills={totalKills}
            participants={participants}
          />
        ) : (
          <div className="flex justify-evenly items-center flex-1">
            <div className="flex flex-col gap-2">
              <MatchResult blueWon={blueWon} />
              <AverageRank participants={participants} />
            </div>

            <MVPPlayer
              championId={participantWithMVP?.champion_id}
              participant={participantWithMVP}
            />
          </div>
        )}

        <div className="items-center gap-4 hidden lg:flex">
          {/* Blue team */}
          <MatchTeam
            team={blueTeamParticipants}
            teamName="blue"
            playerParticipant={playerParticipant}
          />

          {/* vs */}
          <span className="text-muted-foreground text-xs font-medium shrink-0 hidden sm:inline self-center">
            vs
          </span>

          {/* Red team */}
          <MatchTeam
            team={redTeamParticipants}
            teamName="red"
            playerParticipant={playerParticipant}
          />
        </div>
      </div>
      {/* Expand */}
      <div>
        <Button
          size="icon"
          variant="ghost"
          className={cn(
            "h-full min-h-full rounded-none border-none",
            playerParticipant && {
              "bg-blue-600/10 dark:bg-blue-400/20 hover:bg-blue-600/20 dark:hover:bg-blue-400/30":
                hasWon,
              "bg-red-500/10 dark:bg-red-400/10 hover:bg-red-500/20 dark:hover:bg-red-400/20":
                !hasWon,
            },
          )}
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
