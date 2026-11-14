import "server-only";
import { randomUUID } from "node:crypto";
import { formatRank } from "@v1/domain/rank";
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
  // Facts about the viewer; what they may do follows from them (`auctionPermissions`).
  permissions: z.object({
    side: auctionSide.nullable(),
    isCreator: viewerFlag,
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
  const { data, error } = await client.rpc("latest_ranks_by_riot_id", {
    p_game_names: pool.map((player) => player.gameName),
    p_tag_lines: pool.map((player) => player.tagLine),
  });
  if (error) throw error;

  // `ordinal` is the player's place in the pool, counted from 1.
  const rankAt = new Map(data.map((rank) => [rank.ordinal, rank]));
  return pool.map((player, index) => {
    const rank = rankAt.get(index + 1);
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

/**
 * The auction actions. Each runs one auction function under a fresh request id; a refusal is thrown
 * as the database error, whose message is the `AUCTION_*` rule it broke.
 */

type Pool = { gameName: string; tagLine: string }[];

/** Opens a room with the viewer as captain A, and returns its id. */
export async function createAuction(
  client: Client,
  room: {
    players: Pool;
    teamName: string;
    budget: number;
    bidSeconds: number;
    showOrder: boolean;
  },
) {
  const { data, error } = await client.rpc("auction_create_room", {
    p_request_id: randomUUID(),
    p_players: await withLatestRanks(client, room.players),
    p_team_name: room.teamName,
    p_starting_budget: room.budget,
    p_bid_seconds: room.bidSeconds,
    p_order_visible: room.showOrder,
  });
  if (error) throw error;
  return auctionRoomSnapshot.parse(data).id;
}

/** Changes the lobby's settings; a setting left undefined stays as it is. */
export async function updateAuctionLobby(
  client: Client,
  roomId: string,
  lobby: {
    teamName?: string;
    budget?: number;
    bidSeconds?: number;
    showOrder?: boolean;
    players?: Pool;
  },
) {
  const { error } = await client.rpc("auction_update_lobby", {
    p_room_id: roomId,
    p_request_id: randomUUID(),
    p_team_name: lobby.teamName ?? null,
    p_starting_budget: lobby.budget ?? null,
    p_bid_seconds: lobby.bidSeconds ?? null,
    p_order_visible: lobby.showOrder ?? null,
    p_players: lobby.players
      ? await withLatestRanks(client, lobby.players)
      : null,
  });
  if (error) throw error;
}

export async function joinAuction(
  client: Client,
  roomId: string,
  teamName: string,
) {
  const { error } = await client.rpc("auction_join_captain", {
    p_room_id: roomId,
    p_request_id: randomUUID(),
    p_team_name: teamName,
  });
  if (error) throw error;
}

export async function setAuctionReady(
  client: Client,
  roomId: string,
  ready: boolean,
) {
  const { error } = await client.rpc("auction_set_ready", {
    p_room_id: roomId,
    p_request_id: randomUUID(),
    p_ready: ready,
  });
  if (error) throw error;
}

export async function bidInAuction(
  client: Client,
  roomId: string,
  amount: number,
) {
  const { error } = await client.rpc("auction_bid", {
    p_room_id: roomId,
    p_request_id: randomUUID(),
    p_amount: amount,
  });
  if (error) throw error;
}

/** The actions that take nothing but the room. */
const ROOM_ACTIONS = {
  leave: "auction_leave_captain",
  removeCaptain: "auction_remove_captain",
  concede: "auction_concede",
  pass: "auction_pass",
  take: "auction_take",
  cancel: "auction_cancel",
} as const;

export async function runAuctionAction(
  client: Client,
  roomId: string,
  action: keyof typeof ROOM_ACTIONS,
) {
  const { error } = await client.rpc(ROOM_ACTIONS[action], {
    p_room_id: roomId,
    p_request_id: randomUUID(),
  });
  if (error) throw error;
}
