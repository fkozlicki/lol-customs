import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import MatchParticipantWards from "@v1/ui/recipes/matches/match-participant-wards";
import { MVP } from "./match.fixtures";

const meta = {
  title: "Matches/Participant wards",
  component: MatchParticipantWards,
  args: { participant: MVP },
} satisfies Meta<typeof MatchParticipantWards>;

export default meta;

/** Wards placed / wards cleared. The MVP's line. */
export const Default: StoryObj<typeof meta> = {};
