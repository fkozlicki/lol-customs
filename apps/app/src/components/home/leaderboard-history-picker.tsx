"use client";

import LeaderboardHistoryPicker from "@v1/ui/recipes/home/leaderboard-history-picker";
import { parseAsInteger, useQueryState } from "nuqs";
import { maxHistoricallyAfterMatches } from "./leaderboard-after-matches";

interface LeaderboardHistoryProps {
  /** Total ladder matches (rows in `matches`). Numbers are 1 … (n−1), then **live**. */
  trackMatches: number;
  className?: string;
}

/** The history picker, kept in `?after=` so a replayed standings view has a URL. */
export default function LeaderboardHistory({
  trackMatches,
  className,
}: LeaderboardHistoryProps) {
  const [after, setAfter] = useQueryState(
    "after",
    parseAsInteger.withOptions({ shallow: false }),
  );
  const numericMax = maxHistoricallyAfterMatches(trackMatches);

  return (
    <LeaderboardHistoryPicker
      options={Array.from({ length: numericMax }, (_, index) => index + 1)}
      value={after}
      onChange={setAfter}
      className={className}
    />
  );
}
