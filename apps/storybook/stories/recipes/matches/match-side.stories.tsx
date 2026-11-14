import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import MatchSide from "@v1/ui/recipes/matches/match-side";
import { MATCH_CARD, MVP } from "./match.fixtures";

const meta = {
  title: "Matches/Match side",
  component: MatchSide,
  args: { side: MATCH_CARD.blue },
} satisfies Meta<typeof MatchSide>;

export default meta;

type Story = StoryObj<typeof meta>;

/** One side's roster on a collapsed card; the winning side's label is in the foreground. */
export const Blue: Story = {};

export const Red: Story = {
  args: { side: MATCH_CARD.red },
};

/** On a profile, the profile owner is marked within their side. */
export const WithTheProfileOwner: Story = {
  args: { playerKey: MVP.key },
};
