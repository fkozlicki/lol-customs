import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import MatchParticipantScore from "@v1/ui/recipes/matches/match-participant-score";
import { ACE, MVP, UNBADGED } from "./match.fixtures";

const meta = {
  title: "Matches/Participant score",
  component: MatchParticipantScore,
  args: { participant: MVP },
} satisfies Meta<typeof MatchParticipantScore>;

export default meta;

type Story = StoryObj<typeof meta>;

/** The OP score, with the MVP's badge in place of a place. */
export const Mvp: Story = {};

/** The ACE carries its badge too. */
export const Ace: Story = { args: { participant: ACE } };

/** Anyone else shows their place in the match. */
export const Placed: Story = { args: { participant: UNBADGED } };
