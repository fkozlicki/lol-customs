import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import CurrentStreak from "./current-streak";

const meta = {
  title: "Home/Current streak",
  component: CurrentStreak,
  args: { winStreak: 3, loseStreak: 0 },
} satisfies Meta<typeof CurrentStreak>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Winning: Story = {};

export const Losing: Story = {
  args: { winStreak: 0, loseStreak: 4 },
};

/** No matches yet, so no streak to show. */
export const None: Story = {
  args: { winStreak: 0, loseStreak: 0 },
};
