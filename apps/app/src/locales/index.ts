import type { RecipeLocale } from "@v1/ui/recipes/i18n";

/** Every locale the app routes; each must have a recipes dictionary too, or this fails typecheck. */
export const SUPPORTED_LOCALES = [
  "en",
  "pl",
] as const satisfies readonly RecipeLocale[];
export const DEFAULT_LOCALE = "en";

export type Locale = (typeof SUPPORTED_LOCALES)[number];

/** The route segment as a locale; `src/proxy.ts` has already redirected anything else. */
export function toLocale(segment: string): Locale {
  return (
    SUPPORTED_LOCALES.find((locale) => locale === segment) ?? DEFAULT_LOCALE
  );
}
