import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { RatingHistoryChart } from "@v1/ui/recipes/player/rating-history-chart";
import { RATING_POINTS } from "./player.fixtures";

const meta = {
  title: "Player/Rating history chart",
  component: RatingHistoryChart,
  parameters: { layout: "padded" },
  args: { points: RATING_POINTS },
  decorators: [
    (Story) => (
      <div className="w-[40rem]">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof RatingHistoryChart>;

export default meta;

type Story = StoryObj<typeof meta>;

/** The rating after each match against the dotted 1000 everyone starts at. */
export const Season: Story = {};

/** On the all-time track a dashed line marks where each later season began. */
export const AllSeasons: Story = {
  args: { seasonMarkers: [{ seasonNumber: 2, index: 12 }] },
};

export const NoMatches: Story = {
  args: { points: [] },
};
