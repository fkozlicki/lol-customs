import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import {
  MATCH_CARD,
  MATCH_CARD_FOR_ACE,
  MATCH_CARD_FOR_MVP,
} from "./match.fixtures";
import MatchCard from "./match-card";
import MatchHistoryCard from "./match-history-card";

const meta = {
  title: "Matches/Match card",
  component: MatchCard,
  parameters: { layout: "padded" },
  args: { match: MATCH_CARD, isExpanded: false, onToggleExpand: () => {} },
} satisfies Meta<typeof MatchCard>;

export default meta;

type Story = StoryObj<typeof meta>;

/** A match in the history list: the result, MVP and ACE, and both sides. */
export const Collapsed: Story = {};

/**
 * On a profile the card is told from that player's point of view: their champion, KDA and items
 * lead, and the left rule takes the colour of their result.
 */
export const FromTheMvpsProfile: Story = {
  args: { match: MATCH_CARD_FOR_MVP },
};

export const FromTheAcesProfile: Story = {
  args: { match: MATCH_CARD_FOR_ACE },
};

/** The real composition: click the chevron to open the scoreboard under the card. */
export const Interactive: Story = {
  render: () => {
    const [open, setOpen] = useState(true);
    return (
      <MatchHistoryCard
        match={MATCH_CARD}
        expanded={open}
        onToggleExpand={() => setOpen((prev) => !prev)}
      />
    );
  },
};
