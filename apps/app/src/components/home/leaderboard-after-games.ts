/** Max `after` index for historical snapshots: 1 … (totalMatches − 1), then **live**. */
export function maxHistoricallyAfterGames(totalMatches: number): number {
  if (totalMatches <= 0) return 0;
  if (totalMatches === 1) return 1;
  return totalMatches - 1;
}
