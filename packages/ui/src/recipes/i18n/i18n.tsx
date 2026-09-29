"use client";

import { createContext, type ReactNode, useContext, useMemo } from "react";
import en from "./en";
import {
  type At,
  format,
  lookup,
  type Scopes,
  type Strings,
  type Translate,
} from "./format";
import pl from "./pl";

/**
 * The recipes' strings, and the locale they render dates and numbers in.
 *
 * Not next-international, although the app uses it: `createI18nClient` makes a context per call, but
 * keeps its dictionaries in one cache per module keyed only by locale, so a second client would read
 * the app's dictionary (ADR 0004). Both dictionaries here are small and imported statically, so the
 * provider renders on the server without a Suspense boundary.
 */

export const RECIPE_LOCALES = ["en", "pl"] as const;
export type RecipeLocale = (typeof RECIPE_LOCALES)[number];

type Dictionary = typeof en;

const DICTIONARIES: Record<RecipeLocale, Strings<Dictionary>> = { en, pl };

interface RecipesI18n {
  locale: RecipeLocale;
  strings: Strings<Dictionary>;
}

const RecipesI18nContext = createContext<RecipesI18n | null>(null);

export function RecipesI18nProvider({
  locale,
  children,
}: {
  locale: RecipeLocale;
  children: ReactNode;
}) {
  const value = useMemo(
    () => ({ locale, strings: DICTIONARIES[locale] }),
    [locale],
  );

  return (
    <RecipesI18nContext.Provider value={value}>
      {children}
    </RecipesI18nContext.Provider>
  );
}

function useRecipesContext(): RecipesI18n {
  const context = useContext(RecipesI18nContext);
  if (!context) {
    throw new Error("Recipes must be rendered inside `RecipesI18nProvider`");
  }
  return context;
}

/** `t` for one scope of the dictionary, as `useScopedI18n` gives the app. */
export function useRecipesI18n<S extends Scopes<Dictionary>>(
  scope: S,
): Translate<At<Dictionary, S>> {
  const { strings } = useRecipesContext();

  return useMemo(
    () =>
      ((key: string, params?: Record<string, ReactNode>) =>
        format(lookup(strings, `${scope}.${key}`), params)) as Translate<
        At<Dictionary, S>
      >,
    [strings, scope],
  );
}

/** The locale recipes render in, for the date-fns locale and number formats. */
export function useRecipesLocale(): RecipeLocale {
  return useRecipesContext().locale;
}
