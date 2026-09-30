import type { AuctionStatus } from "./auction-list-view";

/**
 * An auction room as its recipes draw it. The app makes these from `auctions.getRoom`
 * (apps/app/src/components/auctions/auction-room-view.ts); the room's rules stay on the server.
 */

export type AuctionSide = "A" | "B";

export type AuctionPhase = "free_auction" | "bidding" | "sold_pause";

/** A player in the pool, on a roster or on the stage. */
export interface AuctionPlayerView {
  id: string;
  name: string;
  rankTier: string | null;
  /** "gold iv"; null when unranked, which the recipe says in the reader's language. */
  rankLabel: string | null;
}

/** A player a captain bought, or was given in a free auction. */
export interface BoughtPlayerView extends AuctionPlayerView {
  /** What they went for; null when they came free. */
  price: number | null;
}

/** One side's roster while the auction runs, and after. */
export interface TeamRosterView {
  side: AuctionSide;
  /** The captain's team name; null while the seat is open, so the recipe says "Team B". */
  teamName: string | null;
  captainName: string | null;
  budget: number;
  remaining: number;
  /** This side holds the highest bid. */
  leading: boolean;
  players: BoughtPlayerView[];
  /** How many players the captain buys. */
  slots: number;
}

/** What the stage shows: the player on sale, the price, and the clock. */
export interface AuctionStageView {
  phase: AuctionPhase;
  /** Which round of how many; null before the first. */
  round: { number: number; total: number } | null;
  /** The team holding the highest bid. */
  leadingTeam: string | null;
  /** The player on sale; null between rounds. */
  player: AuctionPlayerView | null;
  price: number;
  /** The team that opened the round at $1, while it is still being bid on. */
  openedBy: string | null;
  /** The bid clock; null while a sale is being settled. */
  countdown: CountdownView | null;
}

export interface CountdownView {
  deadline: string;
  /** The server's clock when the room was read, so the countdown can correct for drift. */
  serverNow: string;
  durationSeconds: number;
}

export type AuctionEventKind =
  | "created"
  | "captain_joined"
  | "captain_left"
  | "captain_removed"
  | "lobby_updated"
  | "ready"
  | "unready"
  | "countdown_started"
  | "countdown_cancelled"
  | "auction_started"
  | "player_revealed"
  | "opening_bid"
  | "bid"
  | "concede"
  | "pass"
  | "sold"
  | "auto_assigned"
  | "cancelled"
  | "completed";

/** A line in the event feed. */
export interface AuctionEventView {
  key: string;
  kind: AuctionEventKind;
  /** When it happened, formatted for the reader. */
  time: string;
  /** The team it concerns; empty when none. */
  team: string;
  /** The player it concerns; null when unknown, which the recipe says generically. */
  player: string | null;
  amount: number;
}

/** A team in the lobby, before the auction starts. */
export interface LobbyTeamView {
  side: AuctionSide;
  teamName: string | null;
  captain: { name: string; ready: boolean } | null;
  /** The viewer captains this team and may rename it. */
  canRename: boolean;
  /** What the viewer may do to Team B's captain: leave the seat (their own) or remove them. */
  seatAction: "leave" | "remove" | null;
  /** With the seat open: the viewer can join, invite someone (as Team A's captain), or wait. */
  vacancy: "join" | "invite" | "open";
}

export interface LobbyView {
  /** The countdown once both captains are ready. */
  countdown: CountdownView | null;
  teams: Record<AuctionSide, LobbyTeamView>;
  /** The viewer's ready toggle, when they captain a team. */
  ready: { ready: boolean; allowed: boolean } | null;
  pool: AuctionPlayerView[];
  canEditPool: boolean;
}

export interface AuctionRoomHeaderView {
  status: AuctionStatus;
  teamA: string | null;
  teamB: string | null;
  canCancel: boolean;
}
