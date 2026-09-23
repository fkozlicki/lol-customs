"use client";

import { cn } from "@v1/ui/cn";
import { useScopedI18n } from "@/locales/client";
import type { MatchParticipant } from "./match-history-list";

interface MatchParticipantScoreProps {
  p: MatchParticipant;
  scores: number[];
  hideScore?: boolean;
}

export default function MatchParticipantScore({
  p,
  scores,
  hideScore = false,
}: MatchParticipantScoreProps) {
  const t = useScopedI18n("dashboard.pages.matchHistory");
  const opScore = p.op_score;

  if (!opScore) {
    return null;
  }

  const place = 1 + scores.filter((s) => s > opScore).length;

  return (
    <div className="flex items-center justify-center gap-1.5">
      {!hideScore && (
        <span className="num text-xs font-semibold">{opScore.toFixed(1)}</span>
      )}
      <span
        className={cn(
          "num px-1.5 text-[10px] uppercase leading-5 tracking-[0.08em]",
          p.is_mvp && "bg-mvp-surface font-semibold text-mvp-foreground",
          p.is_ace && "bg-ace-surface font-semibold text-ace-foreground",
          !p.is_mvp && !p.is_ace && "bg-muted text-muted-foreground",
        )}
      >
        {p.is_mvp ? t("mvp") : p.is_ace ? t("ace") : `#${place}`}
      </span>
    </div>
  );
}
