import { Progress } from "../../components/progress";
import type { ParticipantView } from "./match-view";

/** Damage dealt and taken, as bars scaled against the highest in the match. */
export default function MatchParticipantDamage({
  participant,
}: {
  participant: ParticipantView;
}) {
  return (
    <div className="flex gap-1 justify-center">
      <div>
        <span className="num text-xs text-muted-foreground">
          {participant.damageDealt.toLocaleString()}
        </span>
        <Progress
          className="h-1 w-10 rounded-none bg-foreground/10 [&>div]:bg-foreground/80"
          value={participant.damageDealtShare}
        />
      </div>
      <div>
        <span className="num text-xs text-muted-foreground">
          {participant.damageTaken.toLocaleString()}
        </span>
        <Progress
          className="h-1 w-10 rounded-none bg-foreground/10 [&>div]:bg-muted-foreground/60"
          value={participant.damageTakenShare}
        />
      </div>
    </div>
  );
}
