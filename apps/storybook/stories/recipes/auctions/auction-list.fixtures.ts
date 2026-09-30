/** Auctions in the list, shaped the way its recipes take them. Names invented. */
import type { AuctionSummaryView } from "@v1/ui/recipes/auctions/auction-list-view";

export const AUCTIONS: AuctionSummaryView[] = [
  {
    id: "1",
    href: "/auctions/1",
    status: "active",
    isMine: false,
    teamAName: "Wolves",
    teamBName: "Ravens",
    captains: ["Kestrel", "Old Tom"],
    hasSecondCaptain: true,
    currentPlayerName: "Nightjar",
    currentBid: 7,
  },
  {
    id: "2",
    href: "/auctions/2",
    status: "waiting",
    isMine: true,
    teamAName: "Team A",
    teamBName: "Team B",
    captains: ["Wren"],
    hasSecondCaptain: false,
    currentPlayerName: null,
    currentBid: 0,
  },
];
