import type { RouterOutputs } from "@v1/api";
import { ALL_TIME_SEASON } from "@v1/api/season";

export type SeasonOption = RouterOutputs["seasons"]["list"][number];

export const SEASON_PARAM = "season";
/** Remembers an explicitly chosen season across visits; absent means the current season. */
export const SEASON_COOKIE = "derby-season";
export const ALL_TIME_PARAM = "all";

/** Maps the `?season=` value to a rating track; missing or unknown values fall back to the current season. */
export function resolveSeason(
  raw: string | null | undefined,
  seasons: SeasonOption[],
): number {
  if (raw === ALL_TIME_PARAM) return ALL_TIME_SEASON;
  const parsed = Number(raw);
  if (raw && Number.isInteger(parsed) && seasons.some((s) => s.id === parsed)) {
    return parsed;
  }
  return (
    seasons.find((s) => s.isCurrent)?.id ??
    seasons.at(-1)?.id ??
    ALL_TIME_SEASON
  );
}

export function seasonToParam(season: number): string {
  return season === ALL_TIME_SEASON ? ALL_TIME_PARAM : String(season);
}

export function seasonNumber(
  season: number,
  seasons: SeasonOption[],
): number | undefined {
  return seasons.find((s) => s.id === season)?.number;
}

/** Keeps an explicitly chosen season when linking between season-scoped pages. */
export function withSeason(href: string, raw: string | null | undefined) {
  if (!raw || href === "#") return href;
  const separator = href.includes("?") ? "&" : "?";
  return `${href}${separator}${SEASON_PARAM}=${encodeURIComponent(raw)}`;
}

export const SEASON_SCOPED_PATHS = [
  "/",
  "/matches",
  "/hof",
  "/duos",
  "/players",
];

export function isSeasonScopedPath(pathname: string): boolean {
  return SEASON_SCOPED_PATHS.some((path) =>
    path === "/" ? pathname === "/" : pathname.startsWith(path),
  );
}
