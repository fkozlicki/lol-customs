import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { AuctionRoomSkeleton } from "@v1/ui/recipes/auctions/auction-room-skeleton";

const meta = {
  title: "Auctions/Room skeleton",
  component: AuctionRoomSkeleton,
  parameters: {
    layout: " the header, the stage between the two rosters.:fullscreen",
  },
} satisfies Meta<typeof AuctionRoomSkeleton>;

export default meta;

/** A room while it loads */
export const Loading: StoryObj<typeof meta> = {};
