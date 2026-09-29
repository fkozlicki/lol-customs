import type { Meta, StoryObj } from "@storybook/react";
import { MATCH_CARD } from "./match.fixtures";
import MatchDetails from "./match-details";

const meta = {
  title: "Matches/Match details",
  component: MatchDetails,
  parameters: { layout: "padded" },
  args: { match: MATCH_CARD },
} satisfies Meta<typeof MatchDetails>;

export default meta;

/**
 * The scoreboard under an expanded card: both sides, the objectives and the kill and gold bars
 * between them. Every number is `num`, so the columns hold.
 */
export const Default: StoryObj<typeof meta> = {};
