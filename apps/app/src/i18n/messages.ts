import { messages as recipes } from "@v1/ui/recipes/messages";
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

/**
 * Spreads the design system's messages beside the app's, flat (ADR 0005). A spread is shallow, so a
 * top-level key on both sides would let one replace the other without a word; the second parameter's
 * type makes any shared top-level key a compile error instead.
 */
export function compose<Recipes extends object, App extends object>(
  recipesMessages: Recipes,
  appMessages: App & { [Key in keyof App & keyof Recipes]: never },
): Recipes & App {
  return { ...recipesMessages, ...appMessages };
}

export type Messages = Shape<typeof recipes.en> & Shape<typeof en>;

/** The one dictionary per locale: the recipes' messages and the app's. */
export const MESSAGES: Record<Locale, Messages> = {
  en: compose(recipes.en, en),
  pl: compose(recipes.pl, pl),
};
