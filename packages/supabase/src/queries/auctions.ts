import "server-only";
import { formatRank } from "@v1/domain/rank";
import { riotIdKey } from "@v1/domain/riot-id";
import { z } from "zod";
import type { Client } from "../types";
import {
  type AuctionPoolEntry,
  auctionEventPayload,
  rankSnapshot,
} from "../types/json";

/**
 * The JSON the auction functions build. The generator types a `jsonb` return as `Json`, so these
 * schemas are both the type and its check: a function whose JSON drifts from them fails here, with
 * the path of the field, instead of reaching the screen half-formed.
 */

const auctionStatus = z.enum([
  "waiting",
  "countdown",
  "active",
  "completed",
  "cancelled",
  "expired",
]);
const auctionPhase = z.enum(["free_auction", "bidding", "sold_pause"]);
const auctionSide = z.enum(["A", "B"]);
const auctionEventType = z.enum([
  "created",
  "captain_joined",
  "captain_left",
  "captain_removed",
  "lobby_updated",
  "ready_changed",
  "countdown_started",
  "countdown_cancelled",
  "auction_started",
  "player_revealed",
  "opening_bid",
  "bid",
  "concede",
  "pass",
  "sold",
  "auto_assigned",
  "cancelled",
  "completed",
  "expired",
]);

// Ids are checked as GUIDs, not RFC UUIDs: they come from the database, which is trusted on that.

/** A comparison with the viewer, which SQL answers with null for a visitor who is not signed in. */
const viewerFlag = z
  .boolean()
  .nullable()
  .transform((value) => value === true);

/** What `_auction_snapshot` returns: the room as one viewer may see it. */
export const auctionRoomSnapshot = z.object({
  id: z.guid(),
  status: auctionStatus,
  phase: auctionPhase.nullable(),
  settings: z.object({
    startingBudget: z.int(),
    bidSeconds: z.int(),
    orderVisible: z.boolean(),
  }),
  currentPlayerId: z.guid().nullable(),
  currentBid: z.int(),
  leadingSide: auctionSide.nullable(),
  roundNumber: z.int(),
  countdownEndsAt: z.string().nullable(),
  bidDeadline: z.string().nullable(),
  phaseDeadline: z.string().nullable(),
  stateVersion: z.int(),
  serverTime: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  captains: z.array(
    z.object({
      side: auctionSide,
      teamName: z.string(),
      profileNickname: z.string(),
      ready: z.boolean(),
      budgetRemaining: z.int(),
      isCurrentUser: viewerFlag,
    }),
  ),
  players: z.array(
    z.object({
      id: z.guid(),
      gameName: z.string(),
      tagLine: z.string(),
      rank: rankSnapshot,
      drawPosition: z.int().nullable(),
      revealed: z.boolean(),
      assignedSide: auctionSide.nullable(),
      purchasePrice: z.int().nullable(),
    }),
  ),
  events: z.array(
    z.object({
      id: z.int(),
      type: auctionEventType,
      actorSide: auctionSide.nullable(),
      playerId: z.guid().nullable(),
      amount: z.int().nullable(),
      payload: auctionEventPayload,
      createdAt: z.string(),
    }),
  ),
  permissions: z.object({
    side: auctionSide.nullable(),
    isCreator: viewerFlag,
    canJoin: viewerFlag,
    canEditLobby: viewerFlag,
    canCancel: viewerFlag,
  }),
});

/** One room as `auction_list_active` lists it. */
export const auctionListRoom = z.object({
  id: z.guid(),
  status: z.enum(["waiting", "countdown", "active"]),
  phase: auctionPhase.nullable(),
  teamA: z.string(),
  teamB: z.string(),
  captainA: z.string(),
  captainB: z.string().nullable(),
  currentPlayer: z.string().nullable(),
  isMine: z.boolean(),
  mySide: auctionSide.nullable(),
  currentBid: z.int(),
  countdownEndsAt: z.string().nullable(),
  bidDeadline: z.string().nullable(),
  phaseDeadline: z.string().nullable(),
  stateVersion: z.int(),
  updatedAt: z.string(),
  serverTime: z.string(),
});

export type AuctionRoomSnapshot = z.infer<typeof auctionRoomSnapshot>;
export type AuctionListRoom = z.infer<typeof auctionListRoom>;

/** The room as the request's viewer may see it, or null when there is no such room. */
export async function getAuctionRoom(
  client: Client,
  roomId: string,
): Promise<AuctionRoomSnapshot | null> {
  const { data, error } = await client.rpc("auction_get_room", {
    p_room_id: roomId,
  });
  if (error) throw error;
  return data === null ? null : auctionRoomSnapshot.parse(data);
}

/** Lobbies and live auctions, the viewer's own first. */
export async function listActiveAuctions(
  client: Client,
): Promise<AuctionListRoom[]> {
  const { data, error } = await client.rpc("auction_list_active");
  if (error) throw error;
  return data.map(({ room }) => auctionListRoom.parse(room));
}

/** The pool with each player's latest ladder rank; players outside the ladder are unranked. */
export async function withLatestRanks(
  client: Client,
  pool: { gameName: string; tagLine: string }[],
): Promise<AuctionPoolEntry[]> {
  const [players, ranks] = await Promise.all([
    client.from("players").select("puuid, game_name, tag_line"),
    client.rpc("player_latest_ranks"),
  ]);
  if (players.error) throw players.error;
  if (ranks.error) throw ranks.error;

  const puuidByRiotId = new Map(
    players.data.flatMap((player) =>
      player.game_name && player.tag_line
        ? [
            [
              riotIdKey({
                gameName: player.game_name,
                tagLine: player.tag_line,
              }),
              player.puuid,
            ] as const,
          ]
        : [],
    ),
  );
  const rankByPuuid = new Map(ranks.data.map((rank) => [rank.puuid, rank]));

  return pool.map((player) => {
    const puuid = puuidByRiotId.get(riotIdKey(player));
    const rank = puuid ? rankByPuuid.get(puuid) : undefined;
    const soloTier = rank?.rank_tier ?? null;
    const soloDivision = rank?.rank_division ?? null;
    return {
      gameName: player.gameName,
      tagLine: player.tagLine,
      rank: {
        soloTier,
        soloDivision,
        soloRankLabel: formatRank(soloTier, soloDivision) ?? "",
      },
    };
  });
}
