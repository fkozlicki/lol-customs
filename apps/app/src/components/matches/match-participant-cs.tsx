import type { MatchParticipant } from "./match-card";

interface MatchParticipantCSProps {
  p: MatchParticipant;
  duration: number;
}

export default function MatchParticipantCS({
  p,
  duration,
}: MatchParticipantCSProps) {
  const csPerMin =
    (p.total_minions_killed ?? 0 + (p.neutral_minions_killed ?? 0)) /
    (duration / 60);

  return (
    <div className="flex flex-col gap-0.5 items-center">
      <span className="text-xs">{p.total_minions_killed ?? 0}</span>
      <span className="text-xs">{csPerMin.toFixed(1)}/m</span>
    </div>
  );
}
