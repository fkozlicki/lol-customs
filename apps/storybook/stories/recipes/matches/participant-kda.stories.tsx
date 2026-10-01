import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import MatchParticipantKDA from "@v1/ui/recipes/matches/match-participant-kda";
import { MVP } from "./match.fixtures";

const meta = {
  title: "Matches/Participant KDA",
  component: MatchParticipantKDA,
  args: { participant: MVP },
} satisfies Meta<typeof MatchParticipantKDA>;

export default meta;

/** Kills / deaths / assists, kill participation, and the ratio. The MVP's line. */
export const Default: StoryObj<typeof meta> = {};
