import type { ReactNode } from "react";
import type {
  AuctionEventView,
  AuctionSide,
  AuctionStageView,
  TeamRosterView,
} from "./auction-room-view";
import { AuctionStage } from "./auction-stage";
import { EventFeed } from "./event-feed";
import { TeamRoster } from "./team-roster";
import { UpcomingOrder } from "./upcoming-order";

interface AuctionBoardProps {
  rosters: Record<AuctionSide, TeamRosterView>;
  stage: AuctionStageView;
  /** The viewer's bidding controls, when they captain a team and the round is open. */
  controls?: ReactNode;
  /** The draw order still to come, for a room that shows it. */
  upcoming: string[] | null;
  events: AuctionEventView[];
}

/** A live auction: the stage between the two rosters, the feed beside Team B. */
export function AuctionBoard({
  rosters,
  stage,
  controls,
  upcoming,
  events,
}: AuctionBoardProps) {
  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(260px,320px)_minmax(0,1fr)_minmax(260px,320px)] lg:gap-12">
      <div className="order-2 lg:order-1">
        <TeamRoster roster={rosters.A} />
      </div>
      <div className="order-1 space-y-8 lg:order-2">
        <AuctionStage stage={stage} controls={controls} />
        {upcoming && <UpcomingOrder players={upcoming} />}
      </div>
      <div className="order-3 space-y-10">
        <TeamRoster roster={rosters.B} />
        <EventFeed events={events} />
      </div>
    </div>
  );
}
