import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Button } from "@v1/ui/button";
import { AuctionRoomHeader } from "@v1/ui/recipes/auctions/auction-room-header";
import { ConnectionBadge } from "@v1/ui/recipes/auctions/connection-badge";
import { expect } from "storybook/test";
import { slots } from "../../controls";
import { wordsFor } from "../../words";

/** The app passes its connection badge as `status` and its cancel button as `action`; here, stand-ins. */
const meta = {
  title: "Auctions/Room header",
  component: AuctionRoomHeader,
  argTypes: { ...slots("status", "action") },
  parameters: { layout: "padded" },
  args: {
    header: {
      status: "active",
      teamA: "Night Owls",
      teamB: "Pierogi Gang",
    },
    status: <ConnectionBadge state="live" />,
    action: <Button variant="outline">Cancel auction</Button>,
  },
} satisfies Meta<typeof AuctionRoomHeader>;

export default meta;

type Story = StoryObj<typeof meta>;

/** A live room: its status and connection above the two teams, and the creator's way to cancel. */
export const Live: Story = {
  play: async ({ canvas }) => {
    await expect(
      canvas.getByRole("button", { name: "Cancel auction" }),
    ).toBeVisible();
  },
};

/** In the lobby with the second seat open, seen by a visitor while realtime has dropped to polling. */
export const InLobby: Story = {
  args: {
    header: {
      status: "waiting",
      teamA: "Night Owls",
      teamB: null,
    },
    status: <ConnectionBadge state="degraded" />,
    action: undefined,
  },
  play: async ({ canvas, globals }) => {
    const t = wordsFor(globals).auctions;
    await expect(canvas.getByRole("heading")).toHaveTextContent(t.room.teamB);
    await expect(canvas.queryByRole("button")).toBeNull();
  },
};
