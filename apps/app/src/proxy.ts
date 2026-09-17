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
  const redirect = restoreRememberedSeason(request);
  if (redirect) return redirect;
  return I18nMiddleware(request);
}

/** Season-scoped pages without `?season=` reopen the season the visitor last picked. */
function restoreRememberedSeason(request: NextRequest) {
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
