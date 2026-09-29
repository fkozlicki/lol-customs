"use client";

import { cn } from "../../utils/cn";
import { ChampionImage } from "../game-assets/champion-image";
import { useRecipesI18n } from "../i18n/i18n";
import type { MatchCardView, ParticipantView } from "./match-view";

/** Neutral card summary: which side won, and the MVP and ACE of the match. */
export function MatchHighlights({ match }: { match: MatchCardView }) {
  const t = useRecipesI18n("match");

  return (
    <div className="flex min-w-0 flex-1 items-center gap-5 overflow-hidden sm:gap-8">
      <div className="flex flex-col gap-1">
        <span className="label-caps">{t("winner")}</span>
        <span className="text-sm font-semibold uppercase tracking-[0.08em]">
          {match.blue.won ? t("sideBlue") : t("sideRed")}
        </span>
      </div>
      <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:gap-8">
        <Highlight participant={match.mvp} label={t("mvp")} tone="mvp" />
        <Highlight participant={match.ace} label={t("ace")} tone="ace" />
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
  participant: ParticipantView | null;
  label: string;
  tone: "mvp" | "ace";
  className?: string;
}) {
  if (!participant) return null;

  return (
    <div className={cn("flex min-w-0 items-center gap-2.5", className)}>
      <ChampionImage
        championId={participant.championId}
        width={40}
        height={40}
        className="size-9 shrink-0 object-cover sm:size-10"
      />
      <div className="flex min-w-0 flex-col gap-0.5">
        <span className="label-caps whitespace-nowrap">
          <span className={tone === "mvp" ? "text-mvp" : "text-ace"}>
            {label}
          </span>
          {participant.opScore != null && (
            <span className="num"> • {participant.opScore.toFixed(1)}</span>
          )}
        </span>
        <span className="max-w-[7rem] truncate text-sm font-medium">
          {participant.name}
        </span>
      </div>
    </div>
  );
}
