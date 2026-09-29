import en from "./en";
import pl from "./pl";

/** A dictionary's shape with every message widened to `string`: what each locale has to match. */
export type Strings<T> = {
  [K in keyof T]: T[K] extends string ? string : Strings<T[K]>;
};

export type RecipeMessages = Strings<typeof en>;

/**
 * The recipes' messages, per locale. The app spreads them beside its own into the one dictionary its
 * `NextIntlClientProvider` serves (ADR 0005); Storybook serves them alone. A recipe reads them with
 * next-intl's `useTranslations`, by the top-level namespace they sit under: `match`, `standings`, ….
 */
export const messages = { en, pl } satisfies Record<string, RecipeMessages>;
