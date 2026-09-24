import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { MatchStats } from "./match-stats";

const meta = {
  title: "Matches/Match stats",
  component: MatchStats,
  parameters: { layout: "padded" },
  args: { blueKills: 35, redKills: 38, blueGold: 73070, redGold: 72866 },
} satisfies Meta<typeof MatchStats>;

export default meta;

type Story = StoryObj<typeof meta>;

/** A close game: the bars sit near the middle. */
export const Close: Story = {};

/** A stomp, where the bar makes the gap visible before you read a number. */
export const Stomp: Story = {
  args: { blueKills: 41, redKills: 12, blueGold: 81200, redGold: 58300 },
};
