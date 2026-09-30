"use client";

import { useTranslations } from "next-intl";
import { ComparisonBar } from "./comparison-bar";

interface MatchStatsProps {
  blueKills: number;
  redKills: number;
  blueGold: number;
  redGold: number;
}

/** Blue side on the left, red side on the right; neutral tones because sides carry no colour. */
export function MatchStats({
  blueKills,
  redKills,
  blueGold,
  redGold,
}: MatchStatsProps) {
  const t = useTranslations("match");

  return (
    <div className="flex-1 space-y-2">
      <ComparisonBar label={t("kills")} blue={blueKills} red={redKills} />
      <ComparisonBar label={t("gold")} blue={blueGold} red={redGold} />
    </div>
  );
}
