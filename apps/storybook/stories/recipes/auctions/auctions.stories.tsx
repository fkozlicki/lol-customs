import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { AuctionListSkeleton } from "@v1/ui/recipes/auctions/auction-list-skeleton";
import { AuctionRoomSkeleton } from "@v1/ui/recipes/auctions/auction-room-skeleton";
import { ConnectionBadge } from "@v1/ui/recipes/auctions/connection-badge";

const meta = {
  title: "Auctions",
  parameters: { layout: "padded" },
} satisfies Meta;

export default meta;

/**
 * Shown on the auction list and in a room. Live means realtime is connected; polling means it
 * dropped and the page is refetching on a timer; connecting pulses until one of them wins.
 */
export const Connection: StoryObj = {
  render: () => (
    <div className="flex gap-6">
      <ConnectionBadge state="live" />
      <ConnectionBadge state="degraded" />
      <ConnectionBadge state="connecting" />
    </div>
  ),
};

/** The list of rooms while it loads, shaped like two of them. */
export const ListLoading: StoryObj = {
  render: () => <AuctionListSkeleton />,
};

/** A room while it loads: the header, the stage between the two rosters. */
export const RoomLoading: StoryObj = {
  parameters: { layout: "fullscreen" },
  render: () => <AuctionRoomSkeleton />,
};
