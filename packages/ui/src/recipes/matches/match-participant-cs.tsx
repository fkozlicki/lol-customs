import type { ParticipantView } from "./match-view";

/** Minions and CS per minute. */
export default function MatchParticipantCS({
  participant,
}: {
  participant: ParticipantView;
}) {
  return (
    <div className="num flex flex-col items-center gap-0.5 text-xs">
      <span>{participant.cs}</span>
      <span className="text-muted-foreground">
        {participant.csPerMinute.toFixed(1)}/m
      </span>
    </div>
  );
}
