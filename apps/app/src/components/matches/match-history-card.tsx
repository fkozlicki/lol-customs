import type { RouterOutputs } from "@v1/api";
import { MatchCard } from "./match-card";
import { type ChampionMap, MatchDetail } from "./match-detail";

type Match = RouterOutputs["matches"]["list"][number];

interface MatchHistoryCardProps {
  match: Match;
  patch: string;
  championMap: ChampionMap;
  expandedMatchId: number | null;
  toggleExpand: (matchId: number) => void;
}

export default function MatchHistoryCard({
  match,
  patch,
  championMap,
  expandedMatchId,
  toggleExpand,
}: MatchHistoryCardProps) {
  return (
    <div key={match.match_id} className="space-y-1">
      <MatchCard
        match={match}
        patch={patch}
        championMap={championMap}
        isExpanded={expandedMatchId === match.match_id}
        onToggleExpand={() => toggleExpand(match.match_id)}
      />
      {expandedMatchId === match.match_id && (
        <MatchDetail match={match} patch={patch} championMap={championMap} />
      )}
    </div>
  );
}
