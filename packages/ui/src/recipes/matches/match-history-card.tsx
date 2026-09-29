import MatchCard from "./match-card";
import MatchDetails from "./match-details";
import type { MatchCardView } from "./match-view";

interface MatchHistoryCardProps {
  match: MatchCardView;
  expanded: boolean;
  onToggleExpand: () => void;
}

/** A card in a match list, with its scoreboard underneath while it is open. */
export default function MatchHistoryCard({
  match,
  expanded,
  onToggleExpand,
}: MatchHistoryCardProps) {
  return (
    <div>
      <MatchCard
        match={match}
        isExpanded={expanded}
        onToggleExpand={onToggleExpand}
      />
      {expanded && <MatchDetails match={match} />}
    </div>
  );
}
