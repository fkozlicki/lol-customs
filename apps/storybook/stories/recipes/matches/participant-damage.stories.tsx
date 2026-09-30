import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import MatchParticipantDamage from "@v1/ui/recipes/matches/match-participant-damage";
import { MVP } from "./match.fixtures";

const meta = {
  title: "Matches/Participant damage",
  component: MatchParticipantDamage,
  args: { participant: MVP },
} satisfies Meta<typeof MatchParticipantDamage>;

export default meta;

/** Damage dealt and taken, as bars scaled against the highest in the match. The MVP's line. */
export const Default: StoryObj<typeof meta> = {};
