import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { PlayerStats } from "@v1/ui/recipes/player/player-stats";
import { QUALIFICATION_MATCHES, STANDINGS } from "../home/standings.fixtures";

const meta = {
  title: "Player/Stats",
  component: PlayerStats,
  parameters: { layout: "padded" },
  args: { stats: STANDINGS[0]!, qualificationMatches: QUALIFICATION_MATCHES },
} satisfies Meta<typeof PlayerStats>;

export default meta;

type Story = StoryObj<typeof meta>;

/** The ladder first: position, rating and record on the selected rating track. */
export const Qualified: Story = {};

/** Still qualifying: the position cell counts the matches left instead. */
export const Qualifying: Story = {
  args: { stats: STANDINGS[STANDINGS.length - 1]! },
};
