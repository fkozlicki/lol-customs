/**
 * Seasons and rating tracks.
 *
 * A **Rating track** is an independent Elo progression: each season has its own, and the all-time
 * track never resets. `ALL_TIME_SEASON` is the track id for the latter.
 */

export const ALL_TIME_SEASON = 0;

/** The value `?season=` carries for the all-time track. */
export const ALL_TIME_PARAM = "all";

export function isAllTime(season: number): boolean {
  return season === ALL_TIME_SEASON;
}

/** Matches a player needs on a rating track to be qualified; mirrors `public.is_qualified`. */
export const QUALIFICATION_MATCHES = 5;

/** Only the fields season resolution needs, so this stays free of the API's generated types. */
export interface SeasonChoice {
  id: number;
  isCurrent?: boolean;
}

/**
 * Maps a `?season=` value to a rating track.
 *
 * Accepts both spellings of the all-time track — "all", which is what the app writes, and "0",
 * which is what `ALL_TIME_SEASON` is. Anything unknown falls back to the current season.
 */
export function resolveSeason(
  raw: string | null | undefined,
  seasons: SeasonChoice[],
): number {
  if (raw === ALL_TIME_PARAM) return ALL_TIME_SEASON;

  const parsed = Number(raw);
  if (raw && Number.isInteger(parsed)) {
    if (parsed === ALL_TIME_SEASON) return ALL_TIME_SEASON;
    if (seasons.some((s) => s.id === parsed)) return parsed;
  }

  return (
    seasons.find((s) => s.isCurrent)?.id ??
    seasons.at(-1)?.id ??
    ALL_TIME_SEASON
  );
}

export function seasonToParam(season: number): string {
  return isAllTime(season) ? ALL_TIME_PARAM : String(season);
}
