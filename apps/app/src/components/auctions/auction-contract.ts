import type { RouterOutputs } from "@v1/api";

export type AuctionStatus =
  | "waiting"
  | "countdown"
  | "active"
  | "completed"
  | "cancelled"
  | "expired";

export type AuctionPhase =
  | "awaiting_opening_bid"
  | "bidding"
  | "sold_pause"
  | null;

export type AuctionSide = "A" | "B";

export type ActiveAuctions = RouterOutputs["auctions"]["listActive"];
export type ActiveAuction = ActiveAuctions[number];
export type AuctionRoomOutput = RouterOutputs["auctions"]["getRoom"];
export type AuctionRoomSnapshot = NonNullable<AuctionRoomOutput>;
export type AuctionPlayer = AuctionRoomSnapshot["players"][number];
export type AuctionCaptain = AuctionRoomSnapshot["captains"][number];
export type AuctionEvent = AuctionRoomSnapshot["events"][number];

export const DEFAULT_PLATFORM_ID = "eun1";

export function riotId(player: { gameName: string; tagLine: string }) {
  return `${player.gameName}#${player.tagLine}`;
}

export function captainFor(
  room: AuctionRoomSnapshot,
  side: AuctionSide,
): AuctionCaptain | undefined {
  return room.captains.find((captain) => captain.side === side);
}

export function playersFor(
  room: AuctionRoomSnapshot,
  side: AuctionSide,
): AuctionPlayer[] {
  return room.players.filter(
    (player) =>
      player.teamSide === side ||
      room.captains.some(
        (captain) => captain.side === side && captain.playerId === player.id,
      ),
  );
}
