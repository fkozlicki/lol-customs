import { AuctionListEmpty } from "./auction-list-empty";
import type { AuctionSummaryView } from "./auction-list-view";
import { AuctionSummaryCard } from "./auction-summary-card";

interface AuctionSummaryListProps {
  auctions: AuctionSummaryView[];
  /** Offered when there is no auction, e.g. a way to open one. */
  emptyAction?: React.ReactNode;
}

/** Every lobby and live auction, or an invitation to open one when there are none. */
export function AuctionSummaryList({
  auctions,
  emptyAction,
}: AuctionSummaryListProps) {
  if (auctions.length === 0) return <AuctionListEmpty action={emptyAction} />;

  return (
    <ul className="space-y-12">
      {auctions.map((auction) => (
        <li key={auction.id}>
          <AuctionSummaryCard auction={auction} />
        </li>
      ))}
    </ul>
  );
}
