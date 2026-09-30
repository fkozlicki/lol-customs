import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import MatchHistorySkeleton from "@v1/ui/recipes/matches/match-history-skeleton";

const meta = {
  title: "Matches/Match history skeleton",
  component: MatchHistorySkeleton,
  parameters: { layout: "padded" },
} satisfies Meta<typeof MatchHistorySkeleton>;

export default meta;

/** The list of card skeletons the match history shows while it loads. */
export const Loading: StoryObj<typeof meta> = {};
