import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { AuctionBoard } from "@v1/ui/recipes/auctions/auction-board";
import { AuctionResults } from "@v1/ui/recipes/auctions/auction-results";
import { AuctionRoomClosed } from "@v1/ui/recipes/auctions/auction-room-closed";
import { AuctionRoomHeader } from "@v1/ui/recipes/auctions/auction-room-header";
import { AuctionRoomNotFound } from "@v1/ui/recipes/auctions/auction-room-not-found";
import { BidControls } from "@v1/ui/recipes/auctions/bid-controls";
import { EventFeed } from "@v1/ui/recipes/auctions/event-feed";
import { FreeAuctionControls } from "@v1/ui/recipes/auctions/free-auction-controls";
import { EVENTS, FINAL_ROSTERS, ROSTERS, stage } from "./auction-room.fixtures";

const noop = () => {};

const meta = {
  title: "Auctions/Room",
  parameters: { layout: "padded" },
} satisfies Meta;

export default meta;

/** The room's status and connection above the two teams; the creator can cancel. */
export const Header: StoryObj = {
  render: () => (
    <div className="space-y-10">
      <AuctionRoomHeader
        header={{
          status: "active",
          teamA: "Night Owls",
          teamB: "Pierogi Gang",
          canCancel: true,
        }}
        connection="live"
        cancelling={false}
        onCancel={noop}
      />
      <AuctionRoomHeader
        header={{
          status: "waiting",
          teamA: "Night Owls",
          teamB: null,
          canCancel: false,
        }}
        connection="degraded"
        cancelling={false}
        onCancel={noop}
      />
    </div>
  ),
};

const bidControls = (
  <BidControls
    minimumBid={6}
    budget={14}
    canBid
    canConcede
    busy={false}
    onBid={noop}
    onConcede={noop}
  />
);

/** A round being bid on, seen by a captain: the stage between the rosters, the feed beside B. */
export const Bidding: StoryObj = {
  render: () => (
    <AuctionBoard
      rosters={ROSTERS}
      stage={stage()}
      controls={bidControls}
      upcoming={["Bramble", "Quill", "Emberly"]}
      events={EVENTS.slice(5)}
    />
  ),
};

/** The same round seen by a visitor: no controls, and a room that keeps its draw order hidden. */
export const Watching: StoryObj = {
  render: () => (
    <AuctionBoard
      rosters={ROSTERS}
      stage={stage()}
      upcoming={null}
      events={EVENTS.slice(5)}
    />
  ),
};

/** The opponent is out of budget: take the player for $1 or pass them over. */
export const FreeAuction: StoryObj = {
  render: () => (
    <AuctionBoard
      rosters={ROSTERS}
      stage={stage({ phase: "free_auction", leadingTeam: null, price: 0 })}
      controls={
        <FreeAuctionControls
          canDecide
          busy={false}
          onTake={noop}
          onPass={noop}
        />
      }
      upcoming={null}
      events={[]}
    />
  ),
};

/** The captain out of budget waits for the other to decide. */
export const OutOfBudget: StoryObj = {
  render: () => (
    <div className="max-w-2xl">
      <FreeAuctionControls
        canDecide={false}
        busy={false}
        onTake={noop}
        onPass={noop}
      />
    </div>
  ),
};

/** A sale being settled: no clock, no controls. */
export const Sold: StoryObj = {
  render: () => (
    <AuctionBoard
      rosters={ROSTERS}
      stage={stage({ phase: "sold_pause", openedBy: null, countdown: null })}
      upcoming={null}
      events={EVENTS.slice(3)}
    />
  ),
};

/** Between rounds, before the next player is revealed. */
export const Preparing: StoryObj = {
  render: () => (
    <AuctionBoard
      rosters={ROSTERS}
      stage={stage({ player: null, leadingTeam: null, round: null })}
      upcoming={null}
      events={[]}
    />
  ),
};

/** Every line the feed can say. */
export const Feed: StoryObj = {
  render: () => (
    <div className="max-w-sm">
      <EventFeed events={EVENTS} />
    </div>
  ),
};

/** Nothing has happened yet. */
export const FeedEmpty: StoryObj = {
  render: () => (
    <div className="max-w-sm">
      <EventFeed events={[]} />
    </div>
  ),
};

/** Every player sold: the final rosters with prices (one came free), and how it went. */
export const Results: StoryObj = {
  render: () => <AuctionResults rosters={FINAL_ROSTERS} events={EVENTS} />,
};

/** A cancelled room and an expired one. */
export const Closed: StoryObj = {
  render: () => (
    <div className="space-y-6">
      <AuctionRoomClosed status="cancelled" />
      <AuctionRoomClosed status="expired" />
    </div>
  ),
};

/** No room behind the link. */
export const NotFound: StoryObj = {
  render: () => <AuctionRoomNotFound onRetry={noop} />,
};
