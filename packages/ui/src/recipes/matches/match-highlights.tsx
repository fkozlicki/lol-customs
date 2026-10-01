"use client";

import { useTranslations } from "next-intl";
import { MatchHighlight } from "./match-highlight";
import type { MatchCardView } from "./match-view";

/** Neutral card summary: which side won, and the MVP and ACE of the match. */
export function MatchHighlights({ match }: { match: MatchCardView }) {
  const t = useTranslations("match");

  return (
    <div className="flex min-w-0 flex-1 items-center gap-5 overflow-hidden sm:gap-8">
      <div className="flex flex-col gap-1">
        <span className="label-caps">{t("winner")}</span>
        <span className="text-sm font-semibold uppercase tracking-[0.08em]">
          {match.blue.won ? t("sideBlue") : t("sideRed")}
        </span>
      </div>
      <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:gap-8">
        <MatchHighlight participant={match.mvp} label={t("mvp")} tone="mvp" />
        <MatchHighlight participant={match.ace} label={t("ace")} tone="ace" />
      </div>
    </div>
  );
}
