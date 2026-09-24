import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import LeaderboardSkeleton from "./leaderboard-skeleton";

const meta = {
  title: "Home/Leaderboard skeleton",
  component: LeaderboardSkeleton,
  parameters: { layout: "padded" },
} satisfies Meta<typeof LeaderboardSkeleton>;

export default meta;

/** Compare against Home › Leaderboard row › Standings: the rows should land where these sit. */
export const Default: StoryObj<typeof meta> = {};
