import type { RouterOutputs } from "@v1/api";

export type ActiveAuctions = RouterOutputs["auctions"]["listActive"];
export type ActiveAuction = ActiveAuctions[number];
export type AuctionRoomOutput = RouterOutputs["auctions"]["getRoom"];
export type AuctionRoomSnapshot = NonNullable<AuctionRoomOutput>;
export type AuctionPlayer = AuctionRoomSnapshot["players"][number];
export type AuctionCaptain = AuctionRoomSnapshot["captains"][number];
export type AuctionEvent = AuctionRoomSnapshot["events"][number];

/** Taken from what the API returns, whose schemas check the database's JSON. */
export type AuctionStatus = AuctionRoomSnapshot["status"];
export type AuctionPhase = AuctionRoomSnapshot["phase"];
export type AuctionSide = AuctionCaptain["side"];

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
  return room.players.filter((player) => player.teamSide === side);
}
