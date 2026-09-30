/**
 * Every story renders the way a page does: the same stylesheet, Geist, a theme class, and the same
 * translation provider the app renders, serving the recipes' messages in the chosen locale. Nothing
 * else — a recipe that needs more than this is reaching past its props.
 */
import { withThemeByClassName } from "@storybook/addon-themes";
import type { Decorator, Preview } from "@storybook/nextjs-vite";
import { messages } from "@v1/ui/recipes/messages";
import { Geist, Geist_Mono } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
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

type Locale = keyof typeof messages;

/**
 * Both locales are a rule, not a preference (DESIGN.md), so the toolbar switches between them. The app's
 * provider inherits its locale and messages from the server; here, outside Next's request, it is told
 * them, and the time zone the app sets, so dates render the same.
 */
const withLocale: Decorator = (Story, context) => {
  const locale = context.globals.locale as Locale;

  return (
    <NextIntlClientProvider
      locale={locale}
      messages={messages[locale]}
      timeZone="Europe/Warsaw"
    >
      <Story />
    </NextIntlClientProvider>
  );
};

const LOCALE_NAMES: Record<Locale, string> = {
  en: "English",
  pl: "Polski",
};

/** A story index entry as `storySort` receives it; the title is all it reads. */
interface SortableEntry {
  title: string;
}

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
        items: (Object.keys(messages) as Locale[]).map((value) => ({
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
    options: {
      /**
       * At every level of the sidebar, folders first and then components, each alphabetically. A
       * component's stories keep the order they are exported in, which is the order they are told.
       *
       * Storybook lifts this function out of the file and evaluates it on its own, so it is written
       * inline, uses nothing from outside itself and carries no annotations; `satisfies` below types it.
       */
      storySort: (a, b) => {
        const left = a.title.trim().split(/\s*\/\s*/);
        const right = b.title.trim().split(/\s*\/\s*/);
        const depth = Math.max(left.length, right.length);
        for (let level = 0; level < depth; level++) {
          const leftName = left[level];
          const rightName = right[level];
          if (leftName === rightName) continue;
          // A title that ends here puts its stories straight into the folder: after its children.
          if (leftName === undefined) return 1;
          if (rightName === undefined) return -1;
          const leftIsFolder = level < left.length - 1;
          const rightIsFolder = level < right.length - 1;
          if (leftIsFolder !== rightIsFolder) return leftIsFolder ? -1 : 1;
          return leftName.localeCompare(rightName, "en", {
            numeric: true,
            sensitivity: "base",
          });
        }
        return 0;
      },
    },
  } satisfies Preview["parameters"] & {
    options: { storySort: (a: SortableEntry, b: SortableEntry) => number };
  },
};

export default preview;
