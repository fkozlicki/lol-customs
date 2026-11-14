import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { RatingChange } from "@v1/ui/recipes/matches/rating-change";

const meta = {
  title: "Matches/Rating change",
  component: RatingChange,
  args: { value: 18 },
} satisfies Meta<typeof RatingChange>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Raised: Story = {};

export const Lowered: Story = {
  args: { value: -14 },
};

/** A match that moved nothing: muted, not coloured, because nothing happened. */
export const Zero: Story = {
  args: { value: 0 },
};

/** Not rated yet — an em dash rather than a zero, so it cannot be misread as "no change". */
export const Unrated: Story = {
  args: { value: null },
};
