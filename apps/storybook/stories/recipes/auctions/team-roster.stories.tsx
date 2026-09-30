import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { TeamRoster } from "@v1/ui/recipes/auctions/team-roster";
import { FINAL_ROSTERS, ROSTERS } from "./auction-room.fixtures";

const meta = {
  title: "Auctions/Team roster",
  component: TeamRoster,
  parameters: { layout: "padded" },
  args: { roster: ROSTERS.A },
  decorators: [
    (Story) => (
      <div className="max-w-xs">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof TeamRoster>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Mid-auction and leading: budget left, the bar of what is spent, two players bought and two to go. */
export const Leading: Story = {};

/** A full roster once the auction ends; a player who came in a free auction has no price. */
export const Full: Story = { args: { roster: FINAL_ROSTERS.B } };

/** Team B before a captain takes the seat: the default name, the whole budget, every slot open. */
export const OpenSeat: Story = {
  args: {
    roster: {
      ...ROSTERS.B,
      teamName: null,
      captainName: null,
      remaining: 20,
      players: [],
    },
  },
};
