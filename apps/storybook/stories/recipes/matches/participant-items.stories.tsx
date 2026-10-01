import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import MatchParticipantItems from "@v1/ui/recipes/matches/match-participant-items";
import { MVP } from "./match.fixtures";

const meta = {
  title: "Matches/Participant items",
  component: MatchParticipantItems,
  args: { itemIds: MVP.itemIds },
} satisfies Meta<typeof MatchParticipantItems>;

export default meta;

/** Six items and the trinket; an empty slot keeps its square. */
export const Default: StoryObj<typeof meta> = {};
