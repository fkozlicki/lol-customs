import type { ParticipantView } from "./match-view";

/** Wards placed / wards cleared. */
export default function MatchParticipantWards({
  participant,
}: {
  participant: ParticipantView;
}) {
  return (
    <span className="num text-xs">
      {participant.wardsPlaced} / {participant.wardsKilled}
    </span>
  );
}
