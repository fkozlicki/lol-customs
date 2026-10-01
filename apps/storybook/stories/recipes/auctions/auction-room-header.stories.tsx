import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { AuctionRoomHeader } from "@v1/ui/recipes/auctions/auction-room-header";
import { expect, fn } from "storybook/test";
import { wordsFor } from "../../words";

const meta = {
  title: "Auctions/Room header",
  component: AuctionRoomHeader,
  parameters: { layout: "padded" },
  args: {
    header: {
      status: "active",
      teamA: "Night Owls",
      teamB: "Pierogi Gang",
      canCancel: true,
    },
    connection: "live",
    cancelling: false,
    onCancel: fn(),
  },
} satisfies Meta<typeof AuctionRoomHeader>;

export default meta;

type Story = StoryObj<typeof meta>;

/** A live room: its status and connection above the two teams, and the creator's way to cancel. */
export const Live: Story = {
  play: async ({ args, canvas, globals, userEvent }) => {
    const t = wordsFor(globals).auctions;
    await userEvent.click(
      canvas.getByRole("button", { name: t.actions.cancel }),
    );
    await expect(args.onCancel).toHaveBeenCalledOnce();
  },
};

/** In the lobby with the second seat open, seen by a visitor while realtime has dropped to polling. */
export const InLobby: Story = {
  args: {
    header: {
      status: "waiting",
      teamA: "Night Owls",
      teamB: null,
      canCancel: false,
    },
    connection: "degraded",
  },
  play: async ({ canvas, globals }) => {
    const t = wordsFor(globals).auctions;
    await expect(canvas.getByRole("heading")).toHaveTextContent(t.room.teamB);
    await expect(canvas.queryByRole("button")).toBeNull();
  },
};
