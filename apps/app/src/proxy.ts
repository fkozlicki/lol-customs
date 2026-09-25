import { type NextRequest, NextResponse } from "next/server";
import { createI18nMiddleware } from "next-international/middleware";
import { DEFAULT_LOCALE, SUPPORTED_LOCALES } from "./locales";
import {
  isSeasonScopedPath,
  SEASON_COOKIE,
  SEASON_PARAM,
} from "./utils/season";

const I18nMiddleware = createI18nMiddleware({
  locales: SUPPORTED_LOCALES,
  defaultLocale: DEFAULT_LOCALE,
  urlMappingStrategy: "rewrite",
});

const LOCALE_PREFIX = new RegExp(`^/(${SUPPORTED_LOCALES.join("|")})(?=/|$)`);

export function proxy(request: NextRequest) {
  const removed = redirectRemovedPage(request);
  if (removed) return removed;

  const redirect = restoreRememberedSeason(request);
  if (redirect) return redirect;
  return I18nMiddleware(request);
}

/** The Rivalry page moved into player profiles. */
function redirectRemovedPage(request: NextRequest) {
  const pathname = request.nextUrl.pathname.replace(LOCALE_PREFIX, "") || "/";
  if (pathname !== "/duos") return null;

  const url = request.nextUrl.clone();
  url.pathname = "/";
  return NextResponse.redirect(url, 308);
}

/**
 * Season-scoped pages without `?season=` reopen the season the visitor last picked.
 *
 * Only page loads are redirected. Next prefetches a link's route tree without its search params, and
 * a redirect there makes the router treat `/` as `/?season=1`, dropping any other param (`?after=`) on
 * the next navigation. Next strips its own prefetch headers before the proxy runs, so the browser's
 * `Sec-Fetch-Mode` is the only way to tell a page load from the router's fetches.
 */
function restoreRememberedSeason(request: NextRequest) {
  const fetchMode = request.headers.get("sec-fetch-mode");
  if (fetchMode && fetchMode !== "navigate") return null;

  const { nextUrl } = request;
  const remembered = request.cookies.get(SEASON_COOKIE)?.value;
  if (!remembered || nextUrl.searchParams.has(SEASON_PARAM)) return null;

  const pathname = nextUrl.pathname.replace(LOCALE_PREFIX, "") || "/";
  if (!isSeasonScopedPath(pathname)) return null;

  const url = nextUrl.clone();
  url.searchParams.set(SEASON_PARAM, remembered);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: [
    "/((?!_next/static|api|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
