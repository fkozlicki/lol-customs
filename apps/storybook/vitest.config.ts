/**
 * Every story is a test. Vitest renders each one in Chromium through Storybook's own pipeline — the
 * same preview, decorators and provider — runs its `play` function, and checks the result with axe.
 *
 * Per locale and theme: half of what the recipes render is locale-dependent, and DESIGN.md asks
 * contrast to survive flipping the theme. One project per pair, the same stories, a different start
 * (`__STORY_LOCALE__` and `__STORY_THEME__`, read in preview.tsx). How many pairs is STORY_VARIANTS's
 * choice, below. `.storybook/vitest.setup.ts` adds what a render alone does not catch.
 */
import path from "node:path";
import { fileURLToPath } from "node:url";
import { storybookTest } from "@storybook/addon-vitest/vitest-plugin";
import { playwright } from "@vitest/browser-playwright";
import {
  defineConfig,
  type TestProjectInlineConfiguration,
} from "vitest/config";

const dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * The recipes' dictionaries, in packages/ui/src/recipes/messages. Written out because Vitest loads this
 * file with plain Node, which cannot follow that package's TypeScript imports; a new dictionary needs a
 * line here too.
 */
const LOCALES = ["en", "pl"];
const THEMES = ["dark", "light"];

const storiesIn = (
  locale: string,
  theme: string,
): TestProjectInlineConfiguration => ({
  extends: true,
  plugins: [
    storybookTest({
      configDir: path.join(dirname, ".storybook"),
      storybookScript: "bun run storybook",
    }),
  ],
  define: {
    __STORY_LOCALE__: JSON.stringify(locale),
    __STORY_THEME__: JSON.stringify(theme),
  },
  test: {
    name: `stories:${locale}:${theme}`,
    browser: {
      enabled: true,
      headless: true,
      // Motion marks a change (DESIGN.md); a test judges the state it settles in.
      provider: playwright({ contextOptions: { reducedMotion: "reduce" } }),
      instances: [{ browser: "chromium" }],
    },
    setupFiles: ["./.storybook/vitest.setup.ts"],
    // Story files share one page instead of a fresh iframe each, as Storybook advises for CI.
    isolate: false,
  },
});

/**
 * Which locale × theme pairs become projects, chosen with STORY_VARIANTS:
 * - `single` (the default): English, dark. Storybook's test widget drives Vitest itself and names the
 *   project after .storybook, so it needs exactly one.
 * - `diagonal`: English dark and Polish light — every locale once and every theme once. What a pull
 *   request runs, on the stories its changes reach.
 * - `full`: all four. What main runs after a merge, on every story.
 */
const VARIANTS = {
  single: [["en", "dark"]],
  diagonal: [
    ["en", "dark"],
    ["pl", "light"],
  ],
  full: LOCALES.flatMap((locale) => THEMES.map((theme) => [locale, theme])),
} as const satisfies Record<string, readonly (readonly [string, string])[]>;

const variants =
  VARIANTS[(process.env.STORY_VARIANTS ?? "single") as keyof typeof VARIANTS];
if (!variants) {
  throw new Error(
    `STORY_VARIANTS must be one of ${Object.keys(VARIANTS).join(", ")}.`,
  );
}

export default defineConfig({
  test: {
    projects: variants.map(([locale, theme]) => storiesIn(locale, theme)),
    // `--changed` picks the stories whose imports reach a changed file. The preview, its stylesheet and
    // tokens and the recipes' dictionaries reach every story through a setup file it does not trace, and
    // Vitest 4.1's default triggers match nothing (vitest#10421), so these are spelled out: a change to
    // any of them runs every story. No trailing /** on a file, which is what broke the defaults.
    forceRerunTriggers: [
      "**/.storybook/**",
      "**/packages/ui/src/styles/**",
      "**/packages/ui/src/recipes/messages/**",
      "**/package.json",
      "**/vitest.config.ts",
      "**/bun.lock",
    ],
    coverage: {
      provider: "v8",
      // What the stories exercise is the design system, not the stories themselves; it lives outside
      // this app, hence allowExternal.
      allowExternal: true,
      include: [path.join(dirname, "../../packages/ui/src/**/*.{ts,tsx}")],
      exclude: ["**/*.test.ts", "**/messages/**"],
      reporter: ["text-summary", "html"],
      reportsDirectory: "./coverage",
    },
  },
});
