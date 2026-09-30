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
import type { StorybookConfig } from "@storybook/nextjs-vite";

const config: StorybookConfig = {
  framework: "@storybook/nextjs-vite",
  stories: [
    {
      titlePrefix: "Design system",
      directory: "../stories",
      files: "tokens.stories.tsx",
    },
    {
      titlePrefix: "Design system",
      directory: "../stories/components",
      files: "**/*.stories.tsx",
    },
    {
      titlePrefix: "Recipes",
      directory: "../stories/recipes",
      files: "**/*.stories.tsx",
    },
  ],
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
