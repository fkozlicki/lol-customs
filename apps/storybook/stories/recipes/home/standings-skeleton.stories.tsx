import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import StandingsSkeleton from "@v1/ui/recipes/home/standings-skeleton";

const meta = {
  title: "Home/Standings skeleton",
  component: StandingsSkeleton,
  parameters: { layout: "padded" },
} satisfies Meta<typeof StandingsSkeleton>;

export default meta;

/** Compare against Home › Standings row › Standings: the rows should land where these sit. */
export const Default: StoryObj<typeof meta> = {};
