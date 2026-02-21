import type { MatchParticipant } from "./match-history-list";

interface MatchParticipantCSProps {
  p: MatchParticipant;
  duration: number;
}

export default function MatchParticipantCS({
  p,
  duration,
}: MatchParticipantCSProps) {
  const cs = (p.total_minions_killed ?? 0) + (p.neutral_minions_killed ?? 0);
  const csPerMin = cs / (duration / 60);

  return (
    <div className="flex flex-col gap-0.5 items-center">
      <span className="text-xs">{cs}</span>
      <span className="text-xs">{csPerMin.toFixed(1)}/m</span>
    </div>
  );
}
