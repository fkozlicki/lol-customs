"use client";

import { formatKdaRatio } from "@v1/domain/stats";
import { useScopedI18n } from "@/locales/client";
import type { MatchParticipant } from "./match-history-list";

interface MatchParticipantKDAProps {
  p: MatchParticipant;
  totalKills: number;
}

export default function MatchParticipantKDA({
  p,
  totalKills,
}: MatchParticipantKDAProps) {
  const t = useScopedI18n("dashboard.pages.matchHistory");
  const killParticipation =
    totalKills > 0
      ? Math.round((((p.kills ?? 0) + (p.assists ?? 0)) / totalKills) * 100)
      : 0;
  const kdaRatio = formatKdaRatio(p.kills, p.deaths, p.assists);

  return (
    <div className="num flex flex-col items-center gap-0.5 text-xs">
      <span>
        {p.kills ?? 0}/{p.deaths ?? 0}/{p.assists ?? 0}{" "}
        <span className="text-muted-foreground">({killParticipation}%)</span>
      </span>
      <span className="text-muted-foreground">
        {kdaRatio === "Perfect" ? t("perfect") : kdaRatio}
      </span>
    </div>
  );
}
