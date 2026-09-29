import en from "@/locales/en";
import pl from "@/locales/pl";
import type { routing } from "./routing";

type Locale = (typeof routing.locales)[number];

/**
 * A dictionary's shape with every message widened to `string`: what each locale has to match, and what
 * `useTranslations` checks keys against. Keeping the literal types would make Polish fail to match
 * English, and would type every `{param}` as a string.
 */
export type Shape<T> = {
  [K in keyof T]: T[K] extends string ? string : Shape<T[K]>;
};

export type Messages = Shape<typeof en>;

/** Every message the app renders, per locale. */
export const MESSAGES: Record<Locale, Messages> = { en, pl };
