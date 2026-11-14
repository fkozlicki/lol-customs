/** The number of players an auction sells; the two captains are not part of the pool. */
export const AUCTION_POOL_SIZE = 8;

/**
 * The rules an auction function can refuse an action by. SQL raises each as `P0001` with the rule as
 * its message (`_auction_fail`); the API passes the rule on, and the app words it.
 */
export const AUCTION_RULES = [
  "AUCTION_PROFILE_REQUIRED",
  "AUCTION_REQUEST_ID_REQUIRED",
  "AUCTION_IDEMPOTENCY_KEY_REUSED",
  "AUCTION_ROOM_NOT_FOUND",
  "AUCTION_ROOM_NOT_WAITING",
  "AUCTION_ROOM_STARTED",
  "AUCTION_ROOM_TERMINAL",
  "AUCTION_PERMISSION_DENIED",
  "AUCTION_ALREADY_CAPTAIN",
  "AUCTION_CAPTAIN_SLOT_TAKEN",
  "AUCTION_CAPTAIN_SLOT_EMPTY",
  "AUCTION_NEEDS_TWO_CAPTAINS",
  "AUCTION_PLAYERS_INVALID",
  "AUCTION_PLAYERS_NOT_UNIQUE",
  "AUCTION_BUDGET_INVALID",
  "AUCTION_BID_SECONDS_INVALID",
  "AUCTION_TEAM_NAME_INVALID",
  "AUCTION_BIDDING_CLOSED",
  "AUCTION_DEADLINE_PASSED",
  "AUCTION_BID_TOO_LOW",
  "AUCTION_BUDGET_EXCEEDED",
  "AUCTION_LEADER_CANNOT_BID",
  "AUCTION_CONCEDE_NOT_ALLOWED",
  "AUCTION_LEADER_CANNOT_CONCEDE",
  "AUCTION_PASS_NOT_ALLOWED",
  "AUCTION_TAKE_NOT_ALLOWED",
] as const;

export type AuctionRule = (typeof AUCTION_RULES)[number];

export function isAuctionRule(value: unknown): value is AuctionRule {
  return AUCTION_RULES.includes(value as AuctionRule);
}

export type AuctionStatus =
  | "waiting"
  | "countdown"
  | "active"
  | "completed"
  | "cancelled"
  | "expired";
export type AuctionPhase = "free_auction" | "bidding" | "sold_pause";
export type AuctionSide = "A" | "B";

/** What a room's snapshot says about the room and the viewer, as far as permissions need it. */
export interface AuctionRoomFacts {
  status: AuctionStatus;
  phase: AuctionPhase | null;
  currentBid: number;
  leadingSide: AuctionSide | null;
  captains: { side: AuctionSide; budgetRemaining: number }[];
  viewer: {
    signedIn: boolean;
    isCreator: boolean;
    /** The side the viewer captains, or null for anyone else. */
    side: AuctionSide | null;
  };
}

export interface AuctionPermissions {
  canJoin: boolean;
  canLeave: boolean;
  canRemoveCaptain: boolean;
  canEditLobby: boolean;
  canReady: boolean;
  canBid: boolean;
  canConcede: boolean;
  canDecideFreeAuction: boolean;
  canCancel: boolean;
}

/**
 * What the viewer may do in the room right now, for the screen to offer. The auction functions
 * enforce the same rules on every action; a clock that runs out between the two is theirs to refuse.
 */
export function auctionPermissions(room: AuctionRoomFacts): AuctionPermissions {
  const { viewer } = room;
  const inLobby = room.status === "waiting" || room.status === "countdown";
  const hasCaptainB = room.captains.some((captain) => captain.side === "B");
  const budget =
    room.captains.find((captain) => captain.side === viewer.side)
      ?.budgetRemaining ?? null;
  const playing = room.status === "active" && viewer.side !== null;
  const leading = room.leadingSide === viewer.side;

  return {
    canJoin:
      viewer.signedIn &&
      viewer.side === null &&
      room.status === "waiting" &&
      !hasCaptainB,
    canLeave: viewer.side === "B" && inLobby,
    canRemoveCaptain: viewer.isCreator && hasCaptainB && inLobby,
    canEditLobby: viewer.isCreator && inLobby,
    canReady: viewer.side !== null && hasCaptainB && inLobby,
    canBid:
      playing &&
      room.phase === "bidding" &&
      !leading &&
      budget !== null &&
      budget > room.currentBid,
    canConcede: playing && room.phase === "bidding" && !leading,
    canDecideFreeAuction: playing && room.phase === "free_auction" && leading,
    canCancel: viewer.isCreator && (inLobby || room.status === "active"),
  };
}
