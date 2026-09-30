/**
 * Every story is a test. Vitest renders each one in Chromium through Storybook's own pipeline — the
 * same preview, decorators and provider — runs its `play` function, and checks the result with axe.
 *
 * Once per locale and theme: half of what the recipes render is locale-dependent, and DESIGN.md asks
 * contrast to survive flipping the theme. One project per pair, the same stories, a different start
 * (`__STORY_LOCALE__` and `__STORY_THEME__`, read in preview.tsx). `.storybook/vitest.setup.ts` adds
 * what a render alone does not catch.
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
  },
});

export default defineConfig({
  test: {
    // Storybook's test widget drives Vitest itself and names the project after .storybook, so it needs
    // exactly one; it runs English in the dark theme. The scripts set STORY_MATRIX for every pair.
    projects:
      process.env.STORY_MATRIX === "1"
        ? LOCALES.flatMap((locale) =>
            THEMES.map((theme) => storiesIn(locale, theme)),
          )
        : [storiesIn("en", "dark")],
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
