/** Max `after` index for historical snapshots: 1 … (totalMatches − 1), then **live**. */
export function maxHistoricallyAfterMatches(totalMatches: number): number {
  if (totalMatches <= 0) return 0;
  if (totalMatches === 1) return 1;
  return totalMatches - 1;
}

/**
 * The `?after=` value as a replay point: a whole number of matches the standings can be replayed
 * after. Anything else, including a number past the last replayable match, means live.
 */
export function replayPoint(
  after: string | undefined,
  totalMatches: number,
): number | undefined {
  if (after === undefined || !/^\d+$/.test(after)) return undefined;
  const value = Number(after);
  return value >= 1 && value <= maxHistoricallyAfterMatches(totalMatches)
    ? value
    : undefined;
}
