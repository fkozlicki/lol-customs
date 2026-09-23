import type { RouterOutputs } from "@v1/api";

export type SeasonOption = RouterOutputs["seasons"]["list"][number];

export const SEASON_PARAM = "season";
/** Remembers an explicitly chosen season across visits; absent means the current season. */
export const SEASON_COOKIE = "derby-season";

/** Season semantics live in the domain package; re-exported so pages have one import. */
export {
  ALL_TIME_PARAM,
  ALL_TIME_SEASON,
  resolveSeason,
  seasonToParam,
} from "@v1/domain/season";
export type { SeasonChoice } from "@v1/domain/season";

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

export const SEASON_SCOPED_PATHS = ["/", "/matches", "/hof", "/players"];

export function isSeasonScopedPath(pathname: string): boolean {
  return SEASON_SCOPED_PATHS.some((path) =>
    path === "/" ? pathname === "/" : pathname.startsWith(path),
  );
}
