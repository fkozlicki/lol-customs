import type { MatchParticipant } from "./match-card";

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
  const kdaRatio = ((p.kills ?? 0) + (p.assists ?? 0)) / (p.deaths ?? 0);

  return (
    <div className="flex flex-col gap-0.5 items-center">
      <span className="text-xs">
        {p.kills ?? 0}/{p.deaths ?? 0}/{p.assists ?? 0} ({killParticipation}
        %)
      </span>
      <span className="text-xs">{kdaRatio.toFixed(2)}</span>
    </div>
  );
}
