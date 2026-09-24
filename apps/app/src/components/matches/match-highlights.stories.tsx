import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { MATCH_VIEW } from "./match.fixtures";
import { MatchHighlights } from "./match-highlights";

const meta = {
  title: "Matches/Match highlights",
  component: MatchHighlights,
  parameters: { layout: "padded" },
  args: { participants: MATCH_VIEW.participants },
} satisfies Meta<typeof MatchHighlights>;

export default meta;

type Story = StoryObj<typeof meta>;

/** The winning side, the MVP in the mvp ink and the ACE in the ace ink — the only colour here. */
export const Default: Story = {};

/** A match rated before MVP and ACE existed: the slots stay, empty, so the row keeps its shape. */
export const NoMvpOrAce: Story = {
  args: {
    participants: MATCH_VIEW.participants.map((p) => ({
      ...p,
      is_mvp: false,
      is_ace: false,
    })),
  },
};
