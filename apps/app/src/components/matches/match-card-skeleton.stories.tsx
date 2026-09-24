import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import MatchCardSkeleton from "./match-card-skeleton";
import MatchHistorySkeleton from "./match-history-skeleton";

const meta = {
  title: "Matches/Skeletons",
  component: MatchCardSkeleton,
  parameters: { layout: "padded" },
} satisfies Meta<typeof MatchCardSkeleton>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Shaped like a collapsed match card, so the list does not jump when the matches land. */
export const Card: Story = {};

/** The list of them the match history shows while it loads. */
export const History: Story = {
  render: () => <MatchHistorySkeleton />,
};
