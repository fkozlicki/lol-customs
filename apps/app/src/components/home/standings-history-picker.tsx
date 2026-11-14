"use client";

import StandingsHistoryPicker from "@v1/ui/recipes/home/standings-history-picker";
import { parseAsInteger, useQueryState } from "nuqs";
import { maxHistoricallyAfterMatches } from "./standings-after-matches";

interface StandingsHistoryProps {
  /** Total ladder matches (rows in `matches`). Numbers are 1 … (n−1), then **live**. */
  matchCount: number;
  className?: string;
}

/** The history picker, kept in `?after=` so a replayed standings view has a URL. */
export default function StandingsHistory({
  matchCount,
  className,
}: StandingsHistoryProps) {
  const [after, setAfter] = useQueryState(
    "after",
    parseAsInteger.withOptions({ shallow: false }),
  );
  const numericMax = maxHistoricallyAfterMatches(matchCount);

  return (
    <StandingsHistoryPicker
      options={Array.from({ length: numericMax }, (_, index) => index + 1)}
      value={after}
      onChange={setAfter}
      className={className}
    />
  );
}
