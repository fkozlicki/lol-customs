export type AuctionStatus =
  | "waiting"
  | "countdown"
  | "active"
  | "completed"
  | "cancelled"
  | "expired";

export type AuctionPhase = "awaiting_opening_bid" | "bidding" | "sold_pause";

export type AuctionSide = "A" | "B";

export type AuctionEventType =
  | "created"
  | "captain_joined"
  | "captain_left"
  | "captain_removed"
  | "lobby_updated"
  | "ready"
  | "unready"
  | "ready_changed"
  | "countdown_started"
  | "countdown_cancelled"
  | "auction_started"
  | "player_revealed"
  | "bid"
  | "pass"
  | "sold"
  | "auto_assigned"
  | "cancelled"
  | "completed";

export interface AuctionListCaptain {
  teamName: string;
  gameName: string;
  tagLine: string;
}

export interface AuctionListItem {
  id: string;
  status: "countdown" | "active";
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
  playerId: string;
  ready: boolean;
  budgetRemaining: number;
  isCurrentUser: boolean;
}

export interface AuctionPlayerView {
  id: string;
  gameName: string;
  tagLine: string;
  platformId: string;
  soloTier: string | null;
  soloDivision: string | null;
  soloRankLabel: string;
  captainSide: AuctionSide | null;
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
  canPass: boolean;
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
