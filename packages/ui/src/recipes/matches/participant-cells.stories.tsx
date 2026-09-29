import type { Meta, StoryObj } from "@storybook/react";
import { ACE, MVP, UNBADGED } from "./match.fixtures";
import MatchParticipantCS from "./match-participant-cs";
import MatchParticipantDamage from "./match-participant-damage";
import MatchParticipantInfo from "./match-participant-info";
import MatchParticipantItems from "./match-participant-items";
import MatchParticipantKDA from "./match-participant-kda";
import MatchParticipantScore from "./match-participant-score";
import MatchParticipantWards from "./match-participant-wards";

const meta = {
  title: "Matches/Participant cells",
  parameters: { layout: "centered" },
} satisfies Meta;

export default meta;

type Story = StoryObj;

/** The cells of one scoreboard row, one story each, each fed the MVP's line. */
export const Info: Story = {
  render: () => <MatchParticipantInfo participant={MVP} />,
};

/** Kills / deaths / assists, kill participation, and the ratio. */
export const Kda: Story = {
  render: () => <MatchParticipantKDA participant={MVP} />,
};

/** The OP score and its place in the match. The MVP and ACE carry their badge instead of a place. */
export const Score: Story = {
  render: () => (
    <div className="flex gap-6">
      <MatchParticipantScore participant={MVP} />
      <MatchParticipantScore participant={ACE} />
      <MatchParticipantScore participant={UNBADGED} />
    </div>
  ),
};

/** Damage dealt and taken, as bars scaled against the highest in the match. */
export const Damage: Story = {
  render: () => <MatchParticipantDamage participant={MVP} />,
};

export const Wards: Story = {
  render: () => <MatchParticipantWards participant={MVP} />,
};

/** Minions and CS per minute. */
export const Cs: Story = {
  render: () => <MatchParticipantCS participant={MVP} />,
};

/** Six items and the trinket; an empty slot keeps its square. */
export const Items: Story = {
  render: () => <MatchParticipantItems itemIds={MVP.itemIds} />,
};
