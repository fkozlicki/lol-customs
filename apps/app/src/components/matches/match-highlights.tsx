"use client";

import { cn } from "@v1/ui/cn";
import { ChampionImage } from "@/components/game-assets/champion-image";
import { useScopedI18n } from "@/locales/client";
import type { MatchParticipant } from "./match-history-list";

/** Neutral card summary: which side won, and the MVP and ACE of the match. */
export function MatchHighlights({
  participants,
}: {
  participants: MatchParticipant[];
}) {
  const t = useScopedI18n("dashboard.pages.matchHistory");
  const blueWon = participants.some((p) => p.team_id === 100 && p.win);
  const mvp = participants.find((p) => p.is_mvp);
  const ace = participants.find((p) => p.is_ace);

  return (
    <div className="flex min-w-0 flex-1 items-center gap-5 overflow-hidden sm:gap-8">
      <div className="flex flex-col gap-1">
        <span className="label-caps">{t("winner")}</span>
        <span className="text-sm font-semibold uppercase tracking-[0.08em]">
          {blueWon ? t("sideBlue") : t("sideRed")}
        </span>
      </div>
      <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:gap-8">
        <Highlight participant={mvp} label={t("mvp")} tone="mvp" />
        <Highlight participant={ace} label={t("ace")} tone="ace" />
      </div>
    </div>
  );
}

function Highlight({
  participant,
  label,
  tone,
  className,
}: {
  participant: MatchParticipant | undefined;
  label: string;
  tone: "mvp" | "ace";
  className?: string;
}) {
  if (!participant) return null;

  return (
    <div className={cn("flex min-w-0 items-center gap-2.5", className)}>
      <ChampionImage
        championId={participant.champion_id}
        width={40}
        height={40}
        className="size-9 shrink-0 object-cover sm:size-10"
      />
      <div className="flex min-w-0 flex-col gap-0.5">
        <span
          className={cn("label-caps", tone === "mvp" ? "text-mvp" : "text-ace")}
        >
          {label}
        </span>
        <span className="max-w-[7rem] truncate text-sm font-medium">
          {participant.players.game_name}
        </span>
      </div>
      {participant.op_score != null && (
        <span className="num hidden text-xs text-muted-foreground sm:inline">
          {participant.op_score.toFixed(1)}
        </span>
      )}
    </div>
  );
}
