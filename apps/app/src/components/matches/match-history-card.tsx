import { MatchCard } from "./match-card";
import {
  type ChampionMap,
  MatchDetail,
  type MatchWithParticipants,
} from "./match-detail";

interface MatchHistoryCardProps {
  entry: MatchWithParticipants;
  patch: string;
  championMap: ChampionMap;
  expandedMatchId: number | null;
  toggleExpand: (matchId: number) => void;
}

export default function MatchHistoryCard({
  entry,
  patch,
  championMap,
  expandedMatchId,
  toggleExpand,
}: MatchHistoryCardProps) {
  return (
    <div key={entry.match.match_id} className="space-y-1">
      <MatchCard
        entry={entry}
        patch={patch}
        championMap={championMap}
        isExpanded={expandedMatchId === entry.match.match_id}
        onToggleExpand={() => toggleExpand(entry.match.match_id)}
      />
      {expandedMatchId === entry.match.match_id && (
        <MatchDetail entry={entry} patch={patch} championMap={championMap} />
      )}
    </div>
  );
}
