import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import LeaderboardHistoryPicker from "./leaderboard-history-picker";

const meta = {
  title: "Home/Leaderboard history picker",
  component: LeaderboardHistoryPicker,
  args: { gamesPlayed: 14 },
} satisfies Meta<typeof LeaderboardHistoryPicker>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Live standings; the picker writes `?after=` to replay them as they stood after N games. */
export const Live: Story = {};

/** Viewing the standings as they were after five games. */
export const AfterFiveGames: Story = {
  parameters: { searchParams: { after: "5" } },
};
