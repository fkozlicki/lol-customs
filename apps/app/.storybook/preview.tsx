/**
 * Every story renders the way a page does: the app's stylesheet, Geist, a theme class and the i18n
 * provider. Anything a component needs that is missing here would make the story lie.
 */
import { withThemeByClassName } from "@storybook/addon-themes";
import type { Decorator, Preview } from "@storybook/nextjs-vite";
import { Geist, Geist_Mono } from "next/font/google";
import { useEffect } from "react";
import { I18nProviderClient } from "@/locales/client";
import "../src/app/[locale]/styles.css";

/**
 * The app gets Geist from the `geist` package, which calls `next/font/local`. Storybook's Next plugin
 * only rewrites `next/font` in first-party files, never in `node_modules`, so that package cannot work
 * here. Same typeface, fetched from Google Fonts instead, under the variable names the tokens read.
 */
const sans = Geist({ subsets: ["latin"], variable: "--font-geist-sans" });
const mono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono" });

/**
 * On `<html>`, not `<body>`: the font tokens are declared on `:root`, so a variable set below it does
 * not reach them. The app sets them on `<body>` and `num`/`label-caps` fall back to a generic mono as
 * a result — a bug in the app, not in the tokens, so Storybook shows what the tokens intend.
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
  <I18nProviderClient locale={context.globals.locale} fallback={null}>
    <Story />
  </I18nProviderClient>
);

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
        items: [
          { value: "en", title: "English" },
          { value: "pl", title: "Polski" },
        ],
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
