import type { Meta, StoryObj } from "@storybook/react";
import { MATCH_CARD } from "./match.fixtures";
import { MatchHighlights } from "./match-highlights";

const meta = {
  title: "Matches/Match highlights",
  component: MatchHighlights,
  parameters: { layout: "padded" },
  args: { match: MATCH_CARD },
} satisfies Meta<typeof MatchHighlights>;

export default meta;

type Story = StoryObj<typeof meta>;

/** The winning side, the MVP in the mvp ink and the ACE in the ace ink — the only colour here. */
export const Default: Story = {};

/** A match rated before MVP and ACE existed: the slots stay, empty, so the row keeps its shape. */
export const NoMvpOrAce: Story = {
  args: { match: { ...MATCH_CARD, mvp: null, ace: null } },
};
