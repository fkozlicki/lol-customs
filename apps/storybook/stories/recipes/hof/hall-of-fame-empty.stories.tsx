import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { HallOfFameEmpty } from "@v1/ui/recipes/hof/hall-of-fame-empty";

const meta = {
  title: "Hall of Fame/Empty",
  component: HallOfFameEmpty,
  parameters: { layout: "padded" },
  args: { qualificationMatches: 5 },
} satisfies Meta<typeof HallOfFameEmpty>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Early in a season nobody qualifies: point to the season before and to all seasons. */
export const OnASeason: Story = {
  args: {
    previousSeason: { seasonNumber: 1, href: "?season=1" },
    allSeasonsHref: "?season=all",
  },
};

/** On the all-time track there is nowhere further to send anyone. */
export const AllSeasons: Story = {};
