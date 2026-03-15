import type { NextRequest } from "next/server";
import { createI18nMiddleware } from "next-international/middleware";
import { DEFAULT_LOCALE, SUPPORTED_LOCALES } from "./locales";

const I18nMiddleware = createI18nMiddleware({
  locales: SUPPORTED_LOCALES,
  defaultLocale: DEFAULT_LOCALE,
  urlMappingStrategy: "rewrite",
});

export function proxy(request: NextRequest) {
  return I18nMiddleware(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|api|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
