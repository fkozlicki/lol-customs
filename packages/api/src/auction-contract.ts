export type AuctionStatus =
  | "waiting"
  | "countdown"
  | "active"
  | "completed"
  | "cancelled"
  | "expired";

export type AuctionPhase = "free_auction" | "bidding" | "sold_pause";

export type AuctionSide = "A" | "B";

export type AuctionEventType =
  | "created"
  | "captain_joined"
  | "captain_left"
  | "captain_removed"
  | "lobby_updated"
  | "ready_changed"
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
  | "completed"
  | "expired";

export interface AuctionListCaptain {
  teamName: string;
  /** Profile nickname; null while the captain B slot is open. */
  captain: string | null;
}

export interface AuctionListItem {
  id: string;
  status: "waiting" | "countdown" | "active";
  /** The viewer is one of its captains. */
  isMine: boolean;
  phase: AuctionPhase | null;
  teamA: AuctionListCaptain;
  teamB: AuctionListCaptain;
  currentPlayer: {
    gameName: string;
    tagLine: string;
  } | null;
  currentBid: number | null;
  countdownEndsAt: string | null;
  phaseEndsAt: string | null;
  updatedAt: string;
}

export interface AuctionCaptainView {
  side: AuctionSide;
  teamName: string;
  profileNickname: string;
  ready: boolean;
  budgetRemaining: number;
  isCurrentUser: boolean;
}

export interface AuctionPlayerView {
  id: string;
  gameName: string;
  tagLine: string;
  soloTier: string | null;
  soloDivision: string | null;
  soloRankLabel: string;
  teamSide: AuctionSide | null;
  purchasePrice: number | null;
  revealed: boolean;
  drawPosition: number | null;
}

export interface AuctionEventView {
  id: number;
  type: AuctionEventType;
  side: AuctionSide | null;
  playerId: string | null;
  amount: number | null;
  payload: Record<string, unknown>;
  createdAt: string;
}

export interface AuctionRoomPermissions {
  isCreator: boolean;
  mySide: AuctionSide | null;
  canJoin: boolean;
  canLeave: boolean;
  canRemoveCaptain: boolean;
  canEditLobby: boolean;
  canReady: boolean;
  canBid: boolean;
  /** Give up a round to the leader while bidding. */
  canConcede: boolean;
  /** Hand the player of a free auction to the captain with no budget. */
  canPass: boolean;
  /** Buy the player of a free auction for $1. */
  canTake: boolean;
  canCancel: boolean;
}

export interface AuctionRoomView {
  id: string;
  status: AuctionStatus;
  phase: AuctionPhase | null;
  budget: number;
  bidSeconds: number;
  showOrder: boolean;
  currentPlayerId: string | null;
  currentBid: number | null;
  currentLeaderSide: AuctionSide | null;
  roundNumber: number;
  countdownEndsAt: string | null;
  phaseEndsAt: string | null;
  createdAt: string;
  updatedAt: string;
  serverNow: string;
  version: number;
  captains: AuctionCaptainView[];
  players: AuctionPlayerView[];
  events: AuctionEventView[];
  permissions: AuctionRoomPermissions;
}
