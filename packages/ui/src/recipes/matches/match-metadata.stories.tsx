import type { Meta, StoryObj } from "@storybook/react";
import {
  MATCH_CARD,
  MATCH_CARD_FOR_ACE,
  MATCH_CARD_FOR_MVP,
} from "./match.fixtures";
import { MatchMetadata } from "./match-metadata";

const meta = {
  title: "Matches/Match metadata",
  component: MatchMetadata,
  args: { match: MATCH_CARD },
} satisfies Meta<typeof MatchMetadata>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Duration and how long ago. Neutral without a profile owner. */
export const Neutral: Story = {};

/** On a profile it also carries that player's result and rating change. */
export const Won: Story = {
  args: { match: MATCH_CARD_FOR_MVP },
};

export const Lost: Story = {
  args: { match: MATCH_CARD_FOR_ACE },
};
