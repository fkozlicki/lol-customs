import type { AuctionSummaryView } from "@v1/ui/recipes/auctions/auction-list-view";
import type { ActiveAuction } from "./auction-contract";

export function toAuctionSummaryView(
  auction: ActiveAuction,
): AuctionSummaryView {
  return {
    id: auction.id,
    href: `/auctions/${auction.id}`,
    status: auction.status,
    isMine: auction.isMine,
    teamAName: auction.teamA.teamName,
    teamBName: auction.teamB.teamName,
    captains: [auction.teamA.captain, auction.teamB.captain].filter(
      (captain): captain is string => Boolean(captain),
    ),
    hasSecondCaptain: Boolean(auction.teamB.captain),
    currentPlayerName: auction.currentPlayer?.gameName ?? null,
    currentBid: auction.currentBid ?? 0,
  };
}
