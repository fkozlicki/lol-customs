import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { AuctionStage } from "@v1/ui/recipes/auctions/auction-stage";
import { BidControls } from "@v1/ui/recipes/auctions/bid-controls";
import { FreeAuctionControls } from "@v1/ui/recipes/auctions/free-auction-controls";
import { fn } from "storybook/test";
import { slots } from "../../controls";
import { stage } from "./auction-room.fixtures";

/** The middle of a live room: the player on sale, the price, the clock, and a captain's controls. */
const meta = {
  title: "Auctions/Stage",
  component: AuctionStage,
  argTypes: { ...slots("controls") },
  parameters: { layout: "padded" },
  args: { stage: stage() },
} satisfies Meta<typeof AuctionStage>;

export default meta;

type Story = StoryObj<typeof meta>;

/** A round being bid on, seen by a captain. */
export const Bidding: Story = {
  args: {
    controls: (
      <BidControls
        minimumBid={6}
        budget={14}
        canBid
        canConcede
        busy={false}
        onBid={fn()}
        onConcede={fn()}
      />
    ),
  },
};

/** The same round seen by a visitor: no controls. */
export const Watching: Story = {};

/** The opponent is out of budget: take the player for $1 or pass them over. */
export const FreeAuction: Story = {
  args: {
    stage: stage({ phase: "free_auction", leadingTeam: null, price: 0 }),
    controls: (
      <FreeAuctionControls canDecide busy={false} onTake={fn()} onPass={fn()} />
    ),
  },
};

/** A sale being settled: no clock, no controls. */
export const Sold: Story = {
  args: {
    stage: stage({ phase: "sold_pause", openedBy: null, countdown: null }),
  },
};

/** Between rounds, before the next player is revealed. */
export const Preparing: Story = {
  args: { stage: stage({ player: null, leadingTeam: null, round: null }) },
};
