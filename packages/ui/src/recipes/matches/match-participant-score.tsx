"use client";

import { useTranslations } from "next-intl";
import { cn } from "../../utils/cn";
import type { ParticipantView } from "./match-view";

interface MatchParticipantScoreProps {
  participant: ParticipantView;
  hideScore?: boolean;
}

/** The OP score and the player's place in the match; the MVP and ACE carry their badge instead. */
export default function MatchParticipantScore({
  participant,
  hideScore = false,
}: MatchParticipantScoreProps) {
  const t = useTranslations("match");
  const { opScore, place, badge } = participant;

  if (!opScore) {
    return null;
  }

  return (
    <div className="flex items-center justify-center gap-1.5">
      {!hideScore && (
        <span className="num text-xs font-semibold">{opScore.toFixed(1)}</span>
      )}
      <span
        className={cn(
          "num px-1.5 text-[10px] uppercase leading-5 tracking-[0.08em]",
          badge === "mvp" && "bg-mvp-surface font-semibold text-mvp-foreground",
          badge === "ace" && "bg-ace-surface font-semibold text-ace-foreground",
          !badge && "bg-muted text-muted-foreground",
        )}
      >
        {badge === "mvp" ? t("mvp") : badge === "ace" ? t("ace") : `#${place}`}
      </span>
    </div>
  );
}
