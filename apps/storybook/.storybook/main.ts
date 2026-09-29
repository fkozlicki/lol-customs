/**
 * One Storybook for Derby's design system, and nothing but it.
 *
 * `packages/ui` holds two tiers — the neutral primitives with the token contract, and the recipes built
 * on them (ADR 0004) — and this renders both from where their stories live, beside the components. The
 * app is not in the graph: recipes take plain props, so a story is its args.
 *
 * `@storybook/nextjs-vite` rather than plain React: game-asset recipes render through `next/image`
 * (ADR 0002), and the preview loads Geist through `next/font`.
 */
import type { StorybookConfig } from "@storybook/nextjs-vite";

const UI = "../../../packages/ui/src";

const config: StorybookConfig = {
  framework: "@storybook/nextjs-vite",
  stories: [
    {
      titlePrefix: "Design system",
      directory: UI,
      files: "tokens.stories.tsx",
    },
    {
      titlePrefix: "Design system",
      directory: `${UI}/components`,
      files: "**/*.stories.tsx",
    },
    {
      titlePrefix: "Recipes",
      directory: `${UI}/recipes`,
      files: "**/*.stories.tsx",
    },
  ],
  addons: ["@storybook/addon-docs", "@storybook/addon-themes"],
  // Rank crests, role and objective icons are self-hosted by the app under public/game/ (ADR 0002);
  // served at the same path here, so the URLs the recipes build resolve unchanged.
  staticDirs: [{ from: "../../app/public/game", to: "/game" }],
};

export default config;
