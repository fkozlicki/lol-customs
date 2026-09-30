import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { AuctionBoard } from "@v1/ui/recipes/auctions/auction-board";
import { BidControls } from "@v1/ui/recipes/auctions/bid-controls";
import { FreeAuctionControls } from "@v1/ui/recipes/auctions/free-auction-controls";
import { fn } from "storybook/test";
import { EVENTS, ROSTERS, stage } from "./auction-room.fixtures";

const meta = {
  title: "Auctions/Board",
  component: AuctionBoard,
  parameters: { layout: "padded" },
  args: {
    rosters: ROSTERS,
    stage: stage(),
    upcoming: ["Bramble", "Quill", "Emberly"],
    events: EVENTS.slice(5),
  },
} satisfies Meta<typeof AuctionBoard>;

export default meta;

type Story = StoryObj<typeof meta>;

/** A round being bid on, seen by a captain: the stage between the rosters, the feed beside Team B. */
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

/** The same round seen by a visitor: no controls, and a room that keeps its draw order hidden. */
export const Watching: Story = { args: { upcoming: null } };

/** The opponent is out of budget: take the player for $1 or pass them over. */
export const FreeAuction: Story = {
  args: {
    stage: stage({ phase: "free_auction", leadingTeam: null, price: 0 }),
    controls: (
      <FreeAuctionControls canDecide busy={false} onTake={fn()} onPass={fn()} />
    ),
    upcoming: null,
    events: [],
  },
};

/** A sale being settled: no clock, no controls. */
export const Sold: Story = {
  args: {
    stage: stage({ phase: "sold_pause", openedBy: null, countdown: null }),
    upcoming: null,
    events: EVENTS.slice(3),
  },
};

/** Between rounds, before the next player is revealed. */
export const Preparing: Story = {
  args: {
    stage: stage({ player: null, leadingTeam: null, round: null }),
    upcoming: null,
    events: [],
  },
};
