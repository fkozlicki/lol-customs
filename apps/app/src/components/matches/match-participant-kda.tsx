import { cn } from "@v1/ui/cn";
import { formatKdaRatio } from "@/utils/stats";
import type { MatchParticipant } from "./match-history-list";

interface MatchParticipantKDAProps {
  p: MatchParticipant;
  totalKills: number;
}

export default function MatchParticipantKDA({
  p,
  totalKills,
}: MatchParticipantKDAProps) {
  const killParticipation = Math.round(
    (((p.kills ?? 0) + (p.assists ?? 0)) / totalKills) * 100,
  );
  const kdaRatio = formatKdaRatio(p.kills, p.deaths, p.assists);

  return (
    <div className="flex flex-col gap-0.5 items-center">
      <span className="text-xs">
        {p.kills ?? 0}/{p.deaths ?? 0}/{p.assists ?? 0} ({killParticipation}
        %)
      </span>

      <span
        className={cn("text-xs", {
          "text-amber-500 font-semibold": kdaRatio === "Perfect",
        })}
      >
        {kdaRatio}
      </span>
    </div>
  );
}
