import { RankCrest } from "@/components/game-assets/rank-crest";
import { averageGameRank } from "@/utils/rank";
import type { MatchParticipant } from "./match-history-list";

interface AverageRankProps {
  participants: MatchParticipant[];
  hideLabel?: boolean;
}

export function AverageRank({
  participants,
  hideLabel = false,
}: AverageRankProps) {
  const rank = averageGameRank(participants);

  return (
    <div>
      {!hideLabel && (
        <span className="text-muted-foreground text-xs">Avg rank:</span>
      )}
      <div className="flex items-center gap-0.5">
        <RankCrest
          tier={rank === "—" ? null : (rank.split(" ")[0] ?? null)}
          width={16}
          height={16}
          className="rounded-sm shrink-0 object-cover"
        />
        <span className="text-xs capitalize">{rank}</span>
      </div>
    </div>
  );
}
