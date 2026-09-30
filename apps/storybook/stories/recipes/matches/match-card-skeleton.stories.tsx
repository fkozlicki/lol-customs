import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import MatchCardSkeleton from "@v1/ui/recipes/matches/match-card-skeleton";

const meta = {
  title: "Matches/Match card skeleton",
  component: MatchCardSkeleton,
  parameters: { layout: "padded" },
} satisfies Meta<typeof MatchCardSkeleton>;

export default meta;

/** Shaped like a collapsed match card, so the list does not jump when the matches land. */
export const Loading: StoryObj<typeof meta> = {};
