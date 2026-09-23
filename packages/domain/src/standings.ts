/**
 * **Season standings**: the ranking of qualified players on a rating track.
 *
 * The position rule mirrors `public.standings_position` in SQL — a player's position is one more
 * than the number of qualified players rated above them, so players on the same rating share a
 * position. Players who are still qualifying hold no position at all.
 */

export interface StandingsRow {
  rating: number | null;
  qualified: boolean | null;
}

/**
 * Assigns a position to every row.
 *
 * Expects the rows already ordered the way `leaderboard_at` returns them: qualified players first,
 * by rating descending. Positions are relative to the rows given, which is the whole standings only
 * while the list starts at the top.
 */
export function withStandingsPositions<T extends StandingsRow>(
  rows: readonly T[],
): (T & { position: number | null })[] {
  let seen = 0;
  let sharedPosition: number | null = null;
  let previousRating: number | null = null;

  return rows.map((row) => {
    if (!row.qualified) {
      return { ...row, position: null };
    }

    seen += 1;
    if (sharedPosition === null || row.rating !== previousRating) {
      sharedPosition = seen;
      previousRating = row.rating;
    }

    return { ...row, position: sharedPosition };
  });
}
