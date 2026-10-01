import { locale as rootLocale } from "next/root-params";
import { hasLocale } from "next-intl";
import { getRequestConfig } from "next-intl/server";
import { MESSAGES } from "./messages";
import { routing } from "./routing";

/**
 * The translation config for one request: the locale from the `[locale]` root segment, which the proxy
 * has already filled in, and that locale's messages. The provider in the root layout inherits both.
 */
export default getRequestConfig(async () => {
  const requested = await rootLocale();
  const locale = hasLocale(routing.locales, requested)
    ? requested
    : routing.defaultLocale;

  return {
    locale,
    messages: MESSAGES[locale],
    // Derby's players are in Poland; a fixed zone keeps server and client dates the same.
    timeZone: "Europe/Warsaw",
  };
});
