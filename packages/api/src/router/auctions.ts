import { randomUUID } from "node:crypto";
import { TRPCError } from "@trpc/server";
import type { Json } from "@v1/supabase/types";
import { z } from "zod";
import type {
  AuctionEventType,
  AuctionListItem,
  AuctionPhase,
  AuctionRoomView,
  AuctionSide,
  AuctionStatus,
} from "../auction-contract";
import { loadAuctionRoster } from "../auction-roster";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";

const roomIdSchema = z.object({ id: z.string().uuid() });

const rosterPlayerSchema = z.object({
  gameName: z.string().trim().min(1).max(100),
  tagLine: z.string().trim().min(1).max(20),
  platformId: z.string().trim().min(1).max(10),
});

const rosterSchema = z
  .array(rosterPlayerSchema)
  .length(10)
  .refine(
    (players) =>
      new Set(
        players.map(
          (player) =>
            `${player.gameName.toLowerCase()}#${player.tagLine.toLowerCase()}`,
        ),
      ).size === 10,
    "Each Riot ID must be unique.",
  );

const teamNameSchema = z.string().trim().min(1).max(100);

interface RpcError {
  code?: string;
  message: string;
}

type RpcCaller = (
  name: string,
  args?: Record<string, unknown>,
) => PromiseLike<{ data: unknown; error: RpcError | null }>;

async function callRpc<T>(
  supabase: { rpc: unknown },
  name: string,
  args?: Record<string, unknown>,
): Promise<T> {
  const { data, error } = await (supabase.rpc as RpcCaller)(name, args);
  if (error) throw domainError(error);
  return data as T;
}

function domainError(error: RpcError): TRPCError {
  const domainCode = error.message.match(/AUCTION_[A-Z_]+/)?.[0];
  const messages: Record<string, string> = {
    AUCTION_PROFILE_REQUIRED: "Create a profile before joining an auction.",
    AUCTION_ROOM_NOT_FOUND: "Auction not found.",
    AUCTION_ALREADY_CAPTAIN: "You are already a captain in another auction.",
    AUCTION_CAPTAIN_SLOT_TAKEN: "The second captain slot is already taken.",
    AUCTION_PERMISSION_DENIED: "You cannot perform this action.",
    AUCTION_DEADLINE_PASSED: "The bidding deadline has passed.",
    AUCTION_BID_TOO_LOW: "The bid is too low.",
    AUCTION_BUDGET_RESERVE: "This bid would leave too little budget.",
    AUCTION_PASS_NOT_ALLOWED: "Pass is not available yet.",
    AUCTION_LEADER_CANNOT_PASS: "The leading captain cannot pass.",
  };
  const message = domainCode
    ? (messages[domainCode] ?? domainCode)
    : error.message;
  const normalized = domainCode ?? error.message.toUpperCase();

  if (normalized.includes("NOT_FOUND")) {
    return new TRPCError({ code: "NOT_FOUND", message });
  }
  if (
    normalized.includes("FORBIDDEN") ||
    normalized.includes("NOT_ALLOWED") ||
    normalized.includes("PERMISSION") ||
    normalized.includes("PROFILE_REQUIRED")
  ) {
    return new TRPCError({ code: "FORBIDDEN", message });
  }
  if (
    normalized.includes("ALREADY") ||
    normalized.includes("TAKEN") ||
    normalized.includes("STALE") ||
    normalized.includes("DEADLINE")
  ) {
    return new TRPCError({ code: "CONFLICT", message });
  }
  return new TRPCError({ code: "BAD_REQUEST", message });
}

interface ProfileClient {
  from: (table: "user_profiles") => {
    select: (columns: "id") => {
      eq: (
        column: "id",
        value: string,
      ) => {
        maybeSingle: () => PromiseLike<{
          data: { id: string } | null;
          error: RpcError | null;
        }>;
      };
    };
  };
}

async function requireProfile(userId: string, client: unknown) {
  const supabase = client as ProfileClient;
  const { data, error } = await supabase
    .from("user_profiles")
    .select("id")
    .eq("id", userId)
    .maybeSingle();

  if (error || !data) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Create a profile before joining an auction.",
    });
  }
}

function riotIdKey(player: { gameName: string; tagLine: string }): string {
  return `${player.gameName.trim().toLowerCase()}#${player.tagLine.trim().toLowerCase()}`;
}

interface RawCaptain {
  side: AuctionSide;
  teamName: string;
  profileNickname: string;
  playerId: string;
  ready: boolean;
  budgetRemaining: number;
  isCurrentUser: boolean;
}

interface RawPlayer {
  id: string;
  gameName: string;
  tagLine: string;
  rank: {
    platformId?: string;
    soloTier?: string | null;
    soloDivision?: string | null;
    soloRankLabel?: string;
  };
  drawPosition: number | null;
  revealed: boolean;
  assignedSide: AuctionSide | null;
  purchasePrice: number | null;
  isCaptain: boolean;
}

interface RawEvent {
  id: number;
  type: AuctionEventType;
  actorSide: AuctionSide | null;
  playerId: string | null;
  amount: number | null;
  payload: Record<string, unknown>;
  createdAt: string;
}

interface RawRoom {
  id: string;
  status: AuctionStatus;
  phase: AuctionPhase | null;
  settings: {
    startingBudget: number;
    bidSeconds: number;
    orderVisible: boolean;
  };
  currentPlayerId: string | null;
  currentBid: number;
  leadingSide: AuctionSide | null;
  countdownEndsAt: string | null;
  bidDeadline: string | null;
  phaseDeadline: string | null;
  stateVersion: number;
  serverTime: string;
  createdAt: string;
  updatedAt: string;
  captains: RawCaptain[];
  players: RawPlayer[];
  events: RawEvent[];
  permissions: {
    side: AuctionSide | null;
    isCreator: boolean;
    canJoin: boolean;
    canEditLobby: boolean;
    canCancel: boolean;
  };
}

interface RawListItem {
  id: string;
  status: "countdown" | "active";
  phase: AuctionPhase | null;
  teamA: string;
  teamB: string;
  captainA: string;
  captainB: string;
  currentPlayer: string | null;
  currentBid: number;
  countdownEndsAt: string | null;
  bidDeadline: string | null;
  phaseDeadline: string | null;
  updatedAt: string;
}

function splitRiotId(value: string): { gameName: string; tagLine: string } {
  const separator = value.lastIndexOf("#");
  return separator > 0
    ? {
        gameName: value.slice(0, separator),
        tagLine: value.slice(separator + 1),
      }
    : { gameName: value, tagLine: "" };
}

function normalizeListItem(raw: RawListItem): AuctionListItem {
  return {
    id: raw.id,
    status: raw.status,
    phase: raw.phase,
    teamA: { teamName: raw.teamA, ...splitRiotId(raw.captainA) },
    teamB: { teamName: raw.teamB, ...splitRiotId(raw.captainB) },
    currentPlayer: raw.currentPlayer ? splitRiotId(raw.currentPlayer) : null,
    currentBid: raw.currentBid || null,
    countdownEndsAt: raw.countdownEndsAt,
    phaseEndsAt: raw.phase === "bidding" ? raw.bidDeadline : raw.phaseDeadline,
    updatedAt: raw.updatedAt,
  };
}

function normalizeRoom(raw: RawRoom): AuctionRoomView {
  const mySide = raw.permissions.side;
  const hasCaptainB = raw.captains.some((captain) => captain.side === "B");
  return {
    id: raw.id,
    status: raw.status,
    phase: raw.phase,
    budget: raw.settings.startingBudget,
    bidSeconds: raw.settings.bidSeconds,
    showOrder: raw.settings.orderVisible,
    currentPlayerId: raw.currentPlayerId,
    currentBid: raw.currentBid || null,
    currentLeaderSide: raw.leadingSide,
    countdownEndsAt: raw.countdownEndsAt,
    phaseEndsAt: raw.phase === "bidding" ? raw.bidDeadline : raw.phaseDeadline,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
    serverNow: raw.serverTime,
    version: raw.stateVersion,
    captains: raw.captains,
    players: raw.players.map((player) => ({
      id: player.id,
      gameName: player.gameName,
      tagLine: player.tagLine,
      platformId: player.rank.platformId ?? "eun1",
      soloTier: player.rank.soloTier ?? null,
      soloDivision: player.rank.soloDivision ?? null,
      soloRankLabel: player.rank.soloRankLabel ?? "",
      captainSide: player.isCaptain ? player.assignedSide : null,
      teamSide: player.assignedSide,
      purchasePrice: player.purchasePrice,
      revealed: player.revealed,
      drawPosition: player.drawPosition,
    })),
    events: raw.events.map((event) => ({
      id: Number(event.id),
      type: event.type,
      side: event.actorSide,
      playerId: event.playerId,
      amount: event.amount,
      payload: event.payload,
      createdAt: event.createdAt,
    })),
    permissions: {
      isCreator: raw.permissions.isCreator,
      mySide,
      canJoin: raw.permissions.canJoin,
      canLeave: mySide === "B" && ["waiting", "countdown"].includes(raw.status),
      canRemoveCaptain:
        raw.permissions.isCreator &&
        hasCaptainB &&
        ["waiting", "countdown"].includes(raw.status),
      canEditLobby: raw.permissions.canEditLobby,
      canReady:
        mySide !== null && ["waiting", "countdown"].includes(raw.status),
      canBid:
        mySide !== null &&
        raw.status === "active" &&
        ["awaiting_opening_bid", "bidding"].includes(raw.phase ?? ""),
      canPass:
        mySide !== null &&
        raw.status === "active" &&
        raw.phase === "bidding" &&
        raw.leadingSide !== mySide,
      canCancel: raw.permissions.canCancel,
    },
  };
}

function rosterPayload(
  players: Awaited<ReturnType<typeof loadAuctionRoster>>,
): Json {
  return players.map((player) => ({
    gameName: player.gameName,
    tagLine: player.tagLine,
    rank: {
      platformId: player.platformId,
      soloTier: player.soloTier,
      soloDivision: player.soloDivision,
      soloRankLabel: player.soloRankLabel,
    },
  })) as Json;
}

export const auctionsRouter = createTRPCRouter({
  listActive: publicProcedure.query(async ({ ctx }) => {
    const data = await callRpc<{ room: RawListItem }[]>(
      ctx.supabase,
      "auction_list_active",
    );
    return (data ?? []).map(({ room }) => normalizeListItem(room));
  }),

  getRoom: publicProcedure.input(roomIdSchema).query(async ({ ctx, input }) => {
    const room = await callRpc<RawRoom | null>(
      ctx.supabase,
      "auction_get_room",
      {
        p_room_id: input.id,
      },
    );
    return room ? normalizeRoom(room) : null;
  }),

  validateRoster: protectedProcedure
    .input(z.object({ players: rosterSchema }))
    .mutation(async ({ ctx, input }) => {
      await requireProfile(ctx.user.id, ctx.supabase);
      const players = await loadAuctionRoster(input.players);
      return {
        players: players.map(({ puuid: _puuid, ...player }) => player),
      };
    }),

  create: protectedProcedure
    .input(
      z.object({
        players: rosterSchema,
        captainRiotId: rosterPlayerSchema.pick({
          gameName: true,
          tagLine: true,
        }),
        teamName: teamNameSchema.default("Team A"),
        budget: z.number().int().min(4).max(100).default(20),
        bidSeconds: z.number().int().min(10).max(60).default(30),
        showOrder: z.boolean().default(false),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await requireProfile(ctx.user.id, ctx.supabase);
      const players = await loadAuctionRoster(input.players);
      const captainIndex = input.players.findIndex(
        (player) => riotIdKey(player) === riotIdKey(input.captainRiotId),
      );
      const captain = players[captainIndex];
      if (!captain) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "The captain Riot ID must be part of the roster.",
        });
      }

      const result = await callRpc<RawRoom>(
        ctx.supabase,
        "auction_create_room",
        {
          p_request_id: randomUUID(),
          p_players: rosterPayload(players),
          p_captain_riot_id: `${captain.gameName}#${captain.tagLine}`,
          p_team_name: input.teamName,
          p_starting_budget: input.budget,
          p_bid_seconds: input.bidSeconds,
          p_order_visible: input.showOrder,
        },
      );
      const room = normalizeRoom(result);
      return { id: room.id, roomId: room.id };
    }),

  joinCaptain: protectedProcedure
    .input(
      roomIdSchema.extend({
        playerId: z.string().uuid(),
        teamName: teamNameSchema.default("Team B"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await requireProfile(ctx.user.id, ctx.supabase);
      await callRpc(ctx.supabase, "auction_join_captain", {
        p_room_id: input.id,
        p_request_id: randomUUID(),
        p_player_id: input.playerId,
        p_team_name: input.teamName,
      });
      return { ok: true };
    }),

  leaveCaptain: protectedProcedure
    .input(roomIdSchema)
    .mutation(async ({ ctx, input }) => {
      await callRpc(ctx.supabase, "auction_leave_captain", {
        p_room_id: input.id,
        p_request_id: randomUUID(),
      });
      return { ok: true };
    }),

  removeCaptain: protectedProcedure
    .input(roomIdSchema)
    .mutation(async ({ ctx, input }) => {
      await callRpc(ctx.supabase, "auction_remove_captain", {
        p_room_id: input.id,
        p_request_id: randomUUID(),
      });
      return { ok: true };
    }),

  updateLobby: protectedProcedure
    .input(
      roomIdSchema.extend({
        teamName: teamNameSchema.optional(),
        budget: z.number().int().min(4).max(100).optional(),
        bidSeconds: z.number().int().min(10).max(60).optional(),
        showOrder: z.boolean().optional(),
        players: rosterSchema.optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const players = input.players
        ? await loadAuctionRoster(input.players)
        : undefined;
      await callRpc(ctx.supabase, "auction_update_lobby", {
        p_room_id: input.id,
        p_request_id: randomUUID(),
        p_team_name: input.teamName ?? null,
        p_starting_budget: input.budget ?? null,
        p_bid_seconds: input.bidSeconds ?? null,
        p_order_visible: input.showOrder ?? null,
        p_players: players ? rosterPayload(players) : null,
      });
      return { ok: true };
    }),

  setReady: protectedProcedure
    .input(roomIdSchema.extend({ ready: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      await callRpc(ctx.supabase, "auction_set_ready", {
        p_room_id: input.id,
        p_request_id: randomUUID(),
        p_ready: input.ready,
      });
      return { ok: true };
    }),

  bid: protectedProcedure
    .input(roomIdSchema.extend({ amount: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      await callRpc(ctx.supabase, "auction_bid", {
        p_room_id: input.id,
        p_request_id: randomUUID(),
        p_amount: input.amount,
      });
      return { ok: true };
    }),

  pass: protectedProcedure
    .input(roomIdSchema)
    .mutation(async ({ ctx, input }) => {
      await callRpc(ctx.supabase, "auction_pass", {
        p_room_id: input.id,
        p_request_id: randomUUID(),
      });
      return { ok: true };
    }),

  cancel: protectedProcedure
    .input(roomIdSchema)
    .mutation(async ({ ctx, input }) => {
      await callRpc(ctx.supabase, "auction_cancel", {
        p_room_id: input.id,
        p_request_id: randomUUID(),
      });
      return { ok: true };
    }),
});
