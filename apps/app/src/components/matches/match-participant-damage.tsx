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
        <span className="text-xs text-muted-foreground">
          {(p.total_damage_dealt_to_champions ?? 0).toLocaleString()}
        </span>
        <Progress
          className="w-10 [&>div]:bg-red-600 dark:[&>div]:bg-red-900 rounded-none h-1.5 bg-background"
          value={damageDealtPercentage}
        />
      </div>
      <div>
        <span className="text-xs text-muted-foreground">
          {(p.total_damage_taken ?? 0).toLocaleString()}
        </span>
        <Progress
          className="w-10 [&>div]:bg-gray-300 rounded-none h-1.5 bg-background dark:[&>div]:bg-gray-600"
          value={damageTakenPercentage}
        />
      </div>
    </div>
  );
}
