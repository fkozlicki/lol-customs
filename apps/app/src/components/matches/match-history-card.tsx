import MatchCard from "./match-card";
import MatchDetail from "./match-detail";
import type { Match } from "./match-history-list";

interface MatchHistoryCardProps {
  match: Match;
  expandedMatchId: number | null;
  toggleExpand: (matchId: number) => void;
}

export default function MatchHistoryCard({
  match,
  expandedMatchId,
  toggleExpand,
}: MatchHistoryCardProps) {
  return (
    <div key={match.match_id} className="space-y-1">
      <MatchCard
        match={match}
        isExpanded={expandedMatchId === match.match_id}
        onToggleExpand={() => toggleExpand(match.match_id)}
      />
      {expandedMatchId === match.match_id && <MatchDetail match={match} />}
    </div>
  );
}
