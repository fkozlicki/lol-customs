/**
 * Every story renders the way a page does: the same stylesheet, Geist, a theme class and the recipes'
 * dictionary in the chosen locale. Nothing else — a recipe that needs more than this is reaching past
 * its props.
 */
import { withThemeByClassName } from "@storybook/addon-themes";
import type { Decorator, Preview } from "@storybook/nextjs-vite";
import {
  RECIPE_LOCALES,
  type RecipeLocale,
  RecipesI18nProvider,
} from "@v1/ui/recipes/i18n";
import { Geist, Geist_Mono } from "next/font/google";
import { useEffect } from "react";
import "./styles.css";

/**
 * The app gets Geist from the `geist` package, which calls `next/font/local`. Storybook's Next plugin
 * only rewrites `next/font` in first-party files, never in `node_modules`, so that package cannot work
 * here. Same typeface, fetched from Google Fonts instead, under the variable names the tokens read.
 */
const sans = Geist({ subsets: ["latin"], variable: "--font-geist-sans" });
const mono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono" });

/**
 * On `<html>`, as in the app's root layout: the font tokens are declared on `:root`, so a variable
 * set any lower does not reach them, and every font falls back to the system stack.
 */
const withGeist: Decorator = (Story) => {
  useEffect(() => {
    const classes = [sans.variable, mono.variable, "antialiased"];
    document.documentElement.classList.add(...classes);
    return () => document.documentElement.classList.remove(...classes);
  }, []);
  return <Story />;
};

/** Both locales are a rule, not a preference (DESIGN.md), so the toolbar switches between them. */
const withLocale: Decorator = (Story, context) => (
  <RecipesI18nProvider locale={context.globals.locale as RecipeLocale}>
    <Story />
  </RecipesI18nProvider>
);

const LOCALE_NAMES: Record<RecipeLocale, string> = {
  en: "English",
  pl: "Polski",
};

const preview: Preview = {
  decorators: [
    withGeist,
    withLocale,
    withThemeByClassName({
      themes: { dark: "dark", light: "light" },
      defaultTheme: "dark",
      parentSelector: "html",
    }),
  ],
  globalTypes: {
    locale: {
      description: "Locale",
      defaultValue: "en",
      toolbar: {
        icon: "globe",
        items: RECIPE_LOCALES.map((value) => ({
          value,
          title: LOCALE_NAMES[value],
        })),
        dynamicTitle: true,
      },
    },
  },
  parameters: {
    layout: "centered",
    controls: { expanded: true },
  },
};

export default preview;
