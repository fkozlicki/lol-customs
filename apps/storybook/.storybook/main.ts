/**
 * One Storybook for Derby's design system, and nothing but it.
 *
 * `packages/ui` holds two tiers — the neutral primitives with the token contract, and the recipes built
 * on them (ADR 0004). Their stories live here, in `stories/`, and import `@v1/ui` the way any consumer
 * does, as in Turborepo's design-system example: a story can only reach what the package exports. The
 * app is not in the graph: recipes take plain props, so a story is its args.
 *
 * `@storybook/nextjs-vite` rather than plain React: game-asset recipes render through `next/image`
 * (ADR 0002), and the preview loads Geist through `next/font`.
 */
import { fileURLToPath } from "node:url";
import type { StorybookConfig } from "@storybook/nextjs-vite";

/** The design system the stories render; the props tables are read from its source. */
const ui = (path: string) =>
  fileURLToPath(new URL(`../../../packages/ui/${path}`, import.meta.url));

/**
 * The DOM props worth a control. Everything else a component inherits from React's own types — a
 * button's hundred event handlers and aria attributes — stays out of the props table.
 */
const USEFUL_DOM_PROPS = new Set([
  "disabled",
  "placeholder",
  "type",
  "required",
  "readOnly",
  "href",
]);

const config: StorybookConfig = {
  framework: "@storybook/nextjs-vite",
  stories: [
    {
      // The tokens, and the pages written in MDX: the introduction and DESIGN.md.
      titlePrefix: "Design system",
      directory: "../stories",
      files: "@(tokens.stories.tsx|*.mdx)",
    },
    {
      titlePrefix: "Design system",
      directory: "../stories/components",
      files: "**/*.stories.tsx",
    },
    {
      titlePrefix: "Recipes",
      directory: "../stories/recipes",
      files: "**/*.@(mdx|stories.tsx)",
    },
  ],
  typescript: {
    // react-docgen, the default, cannot follow `VariantProps<typeof buttonVariants>`, so a primitive's
    // `variant` and `size` never reached the props table or the Controls panel. This one resolves the
    // types, turns unions of literals into radio and select controls, and keeps React's DOM props out.
    reactDocgen: "react-docgen-typescript",
    reactDocgenTypescriptOptions: {
      // The components live in packages/ui, outside this app, which the defaults would not read.
      tsconfigPath: ui("tsconfig.json"),
      include: [ui("src/**/*.tsx")],
      shouldExtractLiteralValuesFromEnum: true,
      shouldRemoveUndefinedFromOptional: true,
      propFilter: (prop) =>
        !prop.declarations?.some((d) => d.fileName.includes("@types/react")) ||
        USEFUL_DOM_PROPS.has(prop.name),
    },
  },
  addons: [
    "@storybook/addon-docs",
    "@storybook/addon-themes",
    "@storybook/addon-a11y",
    "@storybook/addon-vitest",
    "@chromatic-com/storybook",
  ],
  // The app's public files — the logo, and the rank crests, role and objective icons self-hosted
  // under game/ (ADR 0002) — served at the same paths, so the URLs recipes are given resolve unchanged.
  staticDirs: ["../../app/public"],
};

export default config;
