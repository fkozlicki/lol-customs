import { Progress } from "@v1/ui/progress";
import type { MatchParticipant } from "./match-history-list";

interface MatchParticipantDamageProps {
  p: MatchParticipant;
  highestDamageDealt: number;
  highestDamageTaken: number;
}

export default function MatchParticipantDamage({
  p,
  highestDamageDealt,
  highestDamageTaken,
}: MatchParticipantDamageProps) {
  const damageDealtPercentage =
    ((p.total_damage_dealt_to_champions ?? 0) / highestDamageDealt) * 100;
  const damageTakenPercentage =
    ((p.total_damage_taken ?? 0) / highestDamageTaken) * 100;

  return (
    <div className="flex gap-1 justify-center">
      <div>
        <span className="num text-xs text-muted-foreground">
          {(p.total_damage_dealt_to_champions ?? 0).toLocaleString()}
        </span>
        <Progress
          className="h-1 w-10 rounded-none bg-foreground/10 [&>div]:bg-foreground/80"
          value={damageDealtPercentage}
        />
      </div>
      <div>
        <span className="num text-xs text-muted-foreground">
          {(p.total_damage_taken ?? 0).toLocaleString()}
        </span>
        <Progress
          className="h-1 w-10 rounded-none bg-foreground/10 [&>div]:bg-muted-foreground/60"
          value={damageTakenPercentage}
        />
      </div>
    </div>
  );
}
