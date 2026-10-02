import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { AuctionRoomSkeleton } from "@v1/ui/recipes/auctions/auction-room-skeleton";

const meta = {
  title: "Auctions/Room skeleton",
  component: AuctionRoomSkeleton,
  parameters: { layout: "padded" },
} satisfies Meta<typeof AuctionRoomSkeleton>;

export default meta;

/** A room while it loads: the header, the stage between the two rosters. */
export const Loading: StoryObj<typeof meta> = {};
