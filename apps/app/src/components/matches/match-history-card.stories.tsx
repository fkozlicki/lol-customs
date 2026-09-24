import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import MatchCard from "./match-card";
import MatchHistoryCard from "./match-history-card";
import { MATCH, MATCH_VIEW } from "./match.fixtures";

const meta = {
  title: "Matches/Match card",
  component: MatchCard,
  parameters: { layout: "padded" },
  args: { match: MATCH, isExpanded: false, onToggleExpand: () => {} },
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
  args: { puuid: MATCH_VIEW.mvp.puuid },
};

export const FromTheAcesProfile: Story = {
  args: { puuid: MATCH_VIEW.ace.puuid },
};

/** The real composition: click the chevron to open the scoreboard under the card. */
export const Interactive: Story = {
  render: () => {
    const [open, setOpen] = useState<number | null>(MATCH.match_id);
    return (
      <MatchHistoryCard
        match={MATCH}
        expandedMatchId={open}
        toggleExpand={(id) => setOpen((prev) => (prev === id ? null : id))}
      />
    );
  },
};
