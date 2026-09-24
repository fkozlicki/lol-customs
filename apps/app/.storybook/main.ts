/**
 * One Storybook for the whole front end, with two sections.
 *
 * `packages/ui` holds the neutral primitives and the token contract; `apps/app/src/components` holds
 * the Derby compositions built on top of them. They are different tiers, not different projects, so
 * they belong in one instance: composition (`refs`) is for separately published Storybooks, and
 * Storybook's own docs warn that addons stop working across a composed boundary.
 *
 * The runner lives here because the app's components need Next — `next/image`, `next/font`, the App
 * Router — which `@storybook/nextjs-vite` provides and a standalone Vite setup would not.
 */
import type { StorybookConfig } from "@storybook/nextjs-vite";

const config: StorybookConfig = {
  framework: "@storybook/nextjs-vite",
  stories: [
    {
      titlePrefix: "Design system",
      directory: "../../../packages/ui/src",
      files: "**/*.stories.tsx",
    },
    {
      titlePrefix: "App",
      directory: "../src/components",
      files: "**/*.stories.tsx",
    },
  ],
  addons: ["@storybook/addon-docs", "@storybook/addon-themes"],
  // Rank crests, role and objective icons are self-hosted under public/game/, as in the app.
  staticDirs: ["../public"],
};

export default config;
