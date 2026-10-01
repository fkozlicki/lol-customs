import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import MatchParticipantInfo from "@v1/ui/recipes/matches/match-participant-info";
import { MVP } from "./match.fixtures";

const meta = {
  title: "Matches/Participant info",
  component: MatchParticipantInfo,
  args: { participant: MVP },
} satisfies Meta<typeof MatchParticipantInfo>;

export default meta;

/** Champion, level, spells, name and rank: who a scoreboard row is. The MVP's line. */
export const Default: StoryObj<typeof meta> = {};
