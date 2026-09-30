import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import MatchCard from "@v1/ui/recipes/matches/match-card";
import { expect, fn } from "storybook/test";
import { wordsFor } from "../../words";
import {
  MATCH_CARD,
  MATCH_CARD_FOR_ACE,
  MATCH_CARD_FOR_MVP,
} from "./match.fixtures";

const meta = {
  title: "Matches/Match card",
  component: MatchCard,
  parameters: { layout: "padded" },
  args: { match: MATCH_CARD, isExpanded: false, onToggleExpand: fn() },
} satisfies Meta<typeof MatchCard>;

export default meta;

type Story = StoryObj<typeof meta>;

/** A match in the history list: the result, MVP and ACE, and both sides; the chevron asks to open it. */
export const Collapsed: Story = {
  play: async ({ args, canvas, globals, userEvent }) => {
    const t = wordsFor(globals).match;
    const toggle = canvas.getByRole("button", { name: t.expand });
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
    await userEvent.click(toggle);
    await expect(args.onToggleExpand).toHaveBeenCalledOnce();
  },
};

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
