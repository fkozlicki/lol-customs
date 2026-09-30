import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import MatchParticipantCS from "@v1/ui/recipes/matches/match-participant-cs";
import { MVP } from "./match.fixtures";

const meta = {
  title: "Matches/Participant CS",
  component: MatchParticipantCS,
  args: { participant: MVP },
} satisfies Meta<typeof MatchParticipantCS>;

export default meta;

/** Minions and CS per minute. The MVP's line. */
export const Default: StoryObj<typeof meta> = {};
