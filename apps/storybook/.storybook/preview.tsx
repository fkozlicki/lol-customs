/**
 * Every story renders the way a page does: the same stylesheet, Geist, a theme class, and the same
 * translation provider the app renders, serving the recipes' messages in the chosen locale. Nothing
 * else — a recipe that needs more than this is reaching past its props.
 */
import { withThemeByClassName } from "@storybook/addon-themes";
import type { Decorator, Preview } from "@storybook/nextjs-vite";
import { messages } from "@v1/ui/recipes/messages";
import { MotionProvider } from "@v1/ui/recipes/motion-provider";
import isChromatic from "chromatic/isChromatic";
import { MotionGlobalConfig } from "motion/react";
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

/** Set per Vitest project, so the story tests run in every locale and theme (vitest.config.ts). */
declare const __STORY_LOCALE__: Locale | undefined;
declare const __STORY_THEME__: "dark" | "light" | undefined;

// A visual snapshot judges the state a story settles in, like the story tests (vitest.setup.ts).
if (isChromatic()) MotionGlobalConfig.skipAnimations = true;

/** The app's motion settings, as its layout provides them. */
const withMotion: Decorator = (Story) => (
  <MotionProvider>
    <Story />
  </MotionProvider>
);

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

/** DESIGN.md judges a view at these two widths, so the toolbar offers exactly them. */
const VIEWPORTS = {
  phone: {
    name: "Phone · 390",
    styles: { width: "390px", height: "844px" },
    type: "mobile",
  },
  desktop: {
    name: "Desktop · 1280",
    styles: { width: "1280px", height: "800px" },
    type: "desktop",
  },
};

const preview: Preview = {
  // Every component gets a docs page: its props table and every story, with their comments.
  tags: ["autodocs"],
  argsEnhancers: [
    // A prop with a default in the component's signature starts on it, so a select or radio in
    // Controls shows the variant the component renders with, not "Choose option…", without a story
    // having to repeat it.
    ({ argTypes, initialArgs }) =>
      Object.fromEntries(
        Object.entries(argTypes).flatMap(([name, argType]) => {
          const summary = argType.table?.defaultValue?.summary;
          if (name in initialArgs || !argType.options || !summary) return [];
          const value = summary.replace(/^["']|["']$/g, "");
          return argType.options.includes(value) ? [[name, value]] : [];
        }),
      ),
  ],
  decorators: [
    withGeist,
    withLocale,
    withMotion,
    withThemeByClassName({
      themes: { dark: "dark", light: "light" },
      defaultTheme: "dark",
      parentSelector: "html",
    }),
  ],
  initialGlobals: {
    locale: typeof __STORY_LOCALE__ === "string" ? __STORY_LOCALE__ : "en",
    theme: typeof __STORY_THEME__ === "string" ? __STORY_THEME__ : "dark",
  },
  globalTypes: {
    locale: {
      description: "Locale",
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
    // Required props first, so the panel opens on what a story cannot do without.
    controls: { expanded: true, sort: "requiredFirst" },
    // An axe violation fails the story's test. A story that must break a rule says why, per story.
    a11y: { test: "error" },
    viewport: { options: VIEWPORTS },
    // Chromatic snapshots every story in both themes, as DESIGN.md judges a view.
    chromatic: {
      modes: {
        dark: { theme: "dark" },
        light: { theme: "light" },
      },
    },
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
