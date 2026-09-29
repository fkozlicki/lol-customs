import type { Meta, StoryObj } from "@storybook/react";
import { ACE, MVP } from "./match.fixtures";
import { PlayerMetadata } from "./player-metadata";

const meta = {
  title: "Matches/Player metadata",
  component: PlayerMetadata,
  args: { participant: MVP },
} satisfies Meta<typeof PlayerMetadata>;

export default meta;

type Story = StoryObj<typeof meta>;

/** The profile owner's part of a card: champion, KDA, CS, kill participation, OP place, items. */
export const Mvp: Story = {};

export const Ace: Story = {
  args: { participant: ACE },
};
