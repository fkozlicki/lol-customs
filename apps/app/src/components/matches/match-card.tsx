"use client";

import { cn } from "@v1/ui/cn";
import { Icons } from "@v1/ui/icons";
import { useScopedI18n } from "@/locales/client";
import { MatchHighlights } from "./match-highlights";
import type { Match, RawJson } from "./match-history-list";
import { MatchMetadata } from "./match-metadata";
import MatchTeam from "./match-team";
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
  const t = useScopedI18n("dashboard.pages.matchHistory");
  const participants = match.match_participants ?? [];
  const rawParticipants = (match.raw_json as unknown as RawJson).participants;
  const blueTeamParticipants = participants.filter((p) => p.team_id === 100);
  const redTeamParticipants = participants.filter((p) => p.team_id === 200);
  const scores = participants
    .map((p) => p.op_score)
    .filter((opScore): opScore is number => opScore != null)
    .sort((a, b) => b - a);

  const playerParticipant = participants.find((p) => p.puuid === puuid);
  const rawData = rawParticipants.find(
    (par) => par.participantId === playerParticipant?.participant_id,
  );
  const participantTeam =
    playerParticipant?.team_id === 100
      ? blueTeamParticipants
      : redTeamParticipants;
  const totalKills = participantTeam.reduce(
    (acc, p) => acc + (p.kills ?? 0),
    0,
  );
  const outcome = playerParticipant
    ? playerParticipant.win
      ? "win"
      : "loss"
    : null;

  return (
    <div
      className={cn(
        "flex items-stretch border border-l-4 bg-card",
        outcome === "win" && "border-l-win bg-win/[0.1]",
        outcome === "loss" && "border-l-loss bg-loss/[0.1]",
        !outcome && "border-l-foreground/40",
      )}
    >
      <div className="flex min-w-0 flex-1 items-center gap-4 px-3 py-3 sm:gap-6 sm:px-4">
        <MatchMetadata match={match} participant={playerParticipant} />

        {playerParticipant ? (
          <PlayerMetadata
            participant={playerParticipant}
            rawData={rawData}
            scores={scores}
            totalKills={totalKills}
          />
        ) : (
          <MatchHighlights participants={participants} />
        )}

        <div className="hidden shrink-0 items-center gap-4 lg:flex">
          <MatchTeam
            team={blueTeamParticipants}
            side="blue"
            playerParticipant={playerParticipant}
          />
          <MatchTeam
            team={redTeamParticipants}
            side="red"
            playerParticipant={playerParticipant}
          />
        </div>
      </div>

      <button
        type="button"
        onClick={onToggleExpand}
        aria-expanded={isExpanded}
        aria-label={t("expand")}
        className="flex w-9 shrink-0 items-end justify-center border-l pb-3 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        <Icons.ChevronDown
          className={cn(
            "size-4 transition-transform duration-200 ease-(--ease-derby)",
            isExpanded && "rotate-180",
          )}
        />
      </button>
    </div>
  );
}
