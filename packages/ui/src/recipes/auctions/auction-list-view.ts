/**
 * The auctions a visitor can enter, as the list recipes draw them. The app makes these from
 * `auctions.listActive` (apps/app/src/components/auctions/auction-list-view.ts).
 */

export type AuctionStatus =
  | "waiting"
  | "countdown"
  | "active"
  | "completed"
  | "cancelled"
  | "expired";

export interface AuctionSummaryView {
  id: string;
  href: string;
  status: AuctionStatus;
  /** The viewer captains this one. */
  isMine: boolean;
  teamAName: string;
  teamBName: string;
  /** The captains' nicknames, those who have joined. */
  captains: string[];
  /** Waiting for a second captain, or only for both to be ready. */
  hasSecondCaptain: boolean;
  /** The player being sold; null between rounds. */
  currentPlayerName: string | null;
  currentBid: number;
}
