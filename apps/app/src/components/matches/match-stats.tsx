"use client";

import { useScopedI18n } from "@/locales/client";

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
  const t = useScopedI18n("dashboard.pages.matchHistory");

  return (
    <div className="flex-1 space-y-2">
      <ComparisonBar label={t("kills")} blue={blueKills} red={redKills} />
      <ComparisonBar label={t("gold")} blue={blueGold} red={redGold} />
    </div>
  );
}

function ComparisonBar({
  label,
  blue,
  red,
}: {
  label: string;
  blue: number;
  red: number;
}) {
  const total = blue + red;
  const bluePercent = total > 0 ? (blue / total) * 100 : 50;

  return (
    <div className="space-y-1">
      <div className="num flex justify-between text-[11px]">
        <span>{blue.toLocaleString()}</span>
        <span className="label-caps">{label}</span>
        <span>{red.toLocaleString()}</span>
      </div>
      <div className="flex h-1.5 bg-foreground/15">
        <div
          className="h-full bg-foreground/80"
          style={{ width: `${bluePercent}%` }}
        />
      </div>
    </div>
  );
}
