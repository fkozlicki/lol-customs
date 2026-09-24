import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import MatchDetails from "./match-details";
import { MATCH } from "./match.fixtures";

const meta = {
  title: "Matches/Match details",
  component: MatchDetails,
  parameters: { layout: "padded" },
  args: { match: MATCH },
} satisfies Meta<typeof MatchDetails>;

export default meta;

/**
 * The scoreboard under an expanded card: both sides, the objectives and the kill and gold bars
 * between them. Every number is `num`, so the columns hold.
 */
export const Default: StoryObj<typeof meta> = {};
