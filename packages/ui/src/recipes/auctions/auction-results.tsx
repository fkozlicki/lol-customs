import { AuctionCompletedBanner } from "./auction-completed-banner";
import type {
  AuctionEventView,
  AuctionSide,
  TeamRosterView,
} from "./auction-room-view";
import { EventFeed } from "./event-feed";
import { TeamRoster } from "./team-roster";

interface AuctionResultsProps {
  rosters: Record<AuctionSide, TeamRosterView>;
  events: AuctionEventView[];
}

/** A finished auction: the final rosters with their prices, and how it went. */
export function AuctionResults({ rosters, events }: AuctionResultsProps) {
  return (
    <>
      <AuctionCompletedBanner />
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_360px]">
        <TeamRoster roster={rosters.A} />
        <TeamRoster roster={rosters.B} />
        <EventFeed events={events} />
      </div>
    </>
  );
}
