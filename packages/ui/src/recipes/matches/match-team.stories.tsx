import type { Meta, StoryObj } from "@storybook/react";
import { MATCH_CARD, MVP } from "./match.fixtures";
import MatchTeam from "./match-team";

const meta = {
  title: "Matches/Match team",
  component: MatchTeam,
  args: { team: MATCH_CARD.blue },
} satisfies Meta<typeof MatchTeam>;

export default meta;

type Story = StoryObj<typeof meta>;

/** One side's roster on a collapsed card; the winning side's label is in the foreground. */
export const Blue: Story = {};

export const Red: Story = {
  args: { team: MATCH_CARD.red },
};

/** On a profile, the profile owner is marked within their side. */
export const WithTheProfileOwner: Story = {
  args: { playerKey: MVP.key },
};
