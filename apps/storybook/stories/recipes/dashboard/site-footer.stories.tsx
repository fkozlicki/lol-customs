import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { SiteFooter } from "@v1/ui/recipes/dashboard/site-footer";

const meta = {
  title: "Dashboard/Site footer",
  component: SiteFooter,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof SiteFooter>;

export default meta;

/** Riot's attribution notice, verbatim, as the developer policy requires. */
export const Default: StoryObj<typeof meta> = {};
