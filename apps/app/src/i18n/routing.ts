import { defineRouting } from "next-intl/routing";
import { DEFAULT_LOCALE, SUPPORTED_LOCALES } from "@/locales";

/**
 * How the locale travels. Never in the URL: the proxy rewrites `/matches` to `/pl/matches` from the
 * cookie or `Accept-Language`, as next-international's "rewrite" strategy did. The cookie keeps
 * next-international's name, so a visitor's earlier choice survives the switch, and lasts a year
 * rather than a session.
 */
export const routing = defineRouting({
  locales: SUPPORTED_LOCALES,
  defaultLocale: DEFAULT_LOCALE,
  localePrefix: "never",
  localeCookie: { name: "Next-Locale", maxAge: 60 * 60 * 24 * 365 },
});
