import type { NextRequest } from "next/server";
import { createI18nMiddleware } from "next-international/middleware";

const SUPPORTED_LOCALES = ["en", "pl"] as const;
const DEFAULT_LOCALE = "en";

/** Resolve locale from Accept-Language (only called when no Next-Locale cookie). */
function resolveLocaleFromRequest(
  request: NextRequest,
): (typeof SUPPORTED_LOCALES)[number] | null {
  const acceptLanguage = request.headers.get("Accept-Language");
  if (!acceptLanguage) return null;
  const preferred = acceptLanguage
    .split(",")
    .map((part) => part.split(";")[0]?.trim().split("-")[0]?.toLowerCase())
    .find((lang): lang is (typeof SUPPORTED_LOCALES)[number] =>
      Boolean(
        lang &&
          SUPPORTED_LOCALES.includes(
            lang as (typeof SUPPORTED_LOCALES)[number],
          ),
      ),
    );
  return preferred ?? null;
}

const I18nMiddleware = createI18nMiddleware({
  locales: [...SUPPORTED_LOCALES],
  defaultLocale: DEFAULT_LOCALE,
  urlMappingStrategy: "redirect",
  resolveLocaleFromRequest,
});

export function proxy(request: NextRequest) {
  return I18nMiddleware(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|api|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
