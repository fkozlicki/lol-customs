import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { AuctionRoomClosed } from "@v1/ui/recipes/auctions/auction-room-closed";

const meta = {
  title: "Auctions/Room closed",
  component: AuctionRoomClosed,
  parameters: { layout: "padded" },
  args: { status: "cancelled" },
} satisfies Meta<typeof AuctionRoomClosed>;

export default meta;

type Story = StoryObj<typeof meta>;

/** The creator cancelled the room. */
export const Cancelled: Story = {};

/** The room sat idle until it expired. */
export const Expired: Story = { args: { status: "expired" } };
