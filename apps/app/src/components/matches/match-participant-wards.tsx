import type { MatchParticipant } from "./match-card";

interface MatchParticipantWardsProps {
  p: MatchParticipant;
}

export default function MatchParticipantWards({
  p,
}: MatchParticipantWardsProps) {
  return (
    <span className="text-xs">
      {p.wards_placed ?? 0} / {p.wards_killed ?? 0}
    </span>
  );
}
