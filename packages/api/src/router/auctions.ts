import { randomUUID } from "node:crypto";
import { TRPCError } from "@trpc/server";
import { AUCTION_POOL_SIZE } from "@v1/domain/auction";
import { formatRank } from "@v1/domain/rank";
import { riotIdKey } from "@v1/domain/riot-id";
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
import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";

const roomIdSchema = z.object({ id: z.string().uuid() });

const poolPlayerSchema = z.object({
  gameName: z.string().trim().min(1).max(100),
  tagLine: z.string().trim().min(1).max(20),
});

const poolSchema = z
  .array(poolPlayerSchema)
  .length(AUCTION_POOL_SIZE)
  .refine(
    (players) => new Set(players.map(riotIdKey)).size === AUCTION_POOL_SIZE,
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
    AUCTION_ALREADY_CAPTAIN:
      "You are a captain in a live auction. Finish or cancel it first.",
    AUCTION_CAPTAIN_SLOT_TAKEN: "The second captain slot is already taken.",
    AUCTION_PERMISSION_DENIED: "You cannot perform this action.",
    AUCTION_DEADLINE_PASSED: "The bidding deadline has passed.",
    AUCTION_BID_TOO_LOW: "The bid is too low.",
    AUCTION_BUDGET_EXCEEDED: "This bid exceeds your remaining budget.",
    AUCTION_BIDDING_CLOSED: "Bidding is not open right now.",
    AUCTION_LEADER_CANNOT_BID: "You already lead this round.",
    AUCTION_PASS_NOT_ALLOWED: "A pass is only possible in a free auction.",
    AUCTION_CONCEDE_NOT_ALLOWED: "There is nothing to concede right now.",
    AUCTION_LEADER_CANNOT_CONCEDE:
      "You lead this round, so there is nothing to concede.",
    AUCTION_TAKE_NOT_ALLOWED: "Taking for $1 is not available right now.",
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

interface RawCaptain {
  side: AuctionSide;
  teamName: string;
  profileNickname: string;
  ready: boolean;
  budgetRemaining: number;
  isCurrentUser: boolean;
}

interface RawPlayer {
  id: string;
  gameName: string;
  tagLine: string;
  rank: {
    soloTier?: string | null;
    soloDivision?: string | null;
    soloRankLabel?: string;
  };
  drawPosition: number | null;
  revealed: boolean;
  assignedSide: AuctionSide | null;
  purchasePrice: number | null;
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
  roundNumber: number;
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
  status: "waiting" | "countdown" | "active";
  isMine: boolean;
  mySide: AuctionSide | null;
  phase: AuctionPhase | null;
  teamA: string;
  teamB: string;
  captainA: string;
  captainB: string | null;
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
    isMine: raw.isMine,
    mySide: raw.mySide,
    phase: raw.phase,
    teamA: { teamName: raw.teamA, captain: raw.captainA },
    teamB: { teamName: raw.teamB, captain: raw.captainB },
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
  const myBudget =
    raw.captains.find((captain) => captain.side === mySide)?.budgetRemaining ??
    null;
  const active = raw.status === "active" && mySide !== null;
  const leading = raw.leadingSide === mySide;
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
    roundNumber: raw.roundNumber,
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
      soloTier: player.rank.soloTier ?? null,
      soloDivision: player.rank.soloDivision ?? null,
      soloRankLabel: player.rank.soloRankLabel ?? "",
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
      canJoin: raw.permissions.canJoin && mySide === null,
      canLeave: mySide === "B" && ["waiting", "countdown"].includes(raw.status),
      canRemoveCaptain:
        raw.permissions.isCreator &&
        hasCaptainB &&
        ["waiting", "countdown"].includes(raw.status),
      canEditLobby: raw.permissions.canEditLobby,
      canReady:
        mySide !== null &&
        hasCaptainB &&
        ["waiting", "countdown"].includes(raw.status),
      canBid:
        active &&
        raw.phase === "bidding" &&
        !leading &&
        myBudget !== null &&
        myBudget > raw.currentBid,
      canConcede: active && raw.phase === "bidding" && !leading,
      canDecideFreeAuction: active && raw.phase === "free_auction" && leading,
      canCancel: raw.permissions.canCancel,
    },
  };
}

interface PoolClient {
  from: (table: "players") => {
    select: (columns: "puuid, game_name, tag_line") => PromiseLike<{
      data:
        | { puuid: string; game_name: string | null; tag_line: string | null }[]
        | null;
      error: RpcError | null;
    }>;
  };
  rpc: (name: "player_latest_ranks") => PromiseLike<{
    data:
      | {
          puuid: string;
          rank_tier: string | null;
          rank_division: string | null;
        }[]
      | null;
    error: RpcError | null;
  }>;
}

/** The pool with each player's latest ladder rank; players outside the ladder are unranked. */
async function poolPayload(
  client: unknown,
  pool: z.infer<typeof poolSchema>,
): Promise<Json> {
  const supabase = client as PoolClient;
  const [players, ranks] = await Promise.all([
    supabase.from("players").select("puuid, game_name, tag_line"),
    supabase.rpc("player_latest_ranks"),
  ]);
  if (players.error) throw domainError(players.error);
  if (ranks.error) throw domainError(ranks.error);

  const puuidByRiotId = new Map(
    (players.data ?? []).flatMap((player) =>
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
  const rankByPuuid = new Map(
    (ranks.data ?? []).map((rank) => [rank.puuid, rank]),
  );

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
  }) as Json;
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

  create: protectedProcedure
    .input(
      z.object({
        players: poolSchema,
        teamName: teamNameSchema.default("Team A"),
        budget: z.number().int().min(4).max(100).default(20),
        bidSeconds: z.number().int().min(10).max(60).default(30),
        showOrder: z.boolean().default(false),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await requireProfile(ctx.user.id, ctx.supabase);
      const result = await callRpc<RawRoom>(
        ctx.supabase,
        "auction_create_room",
        {
          p_request_id: randomUUID(),
          p_players: await poolPayload(ctx.supabase, input.players),
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
        teamName: teamNameSchema.default("Team B"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await requireProfile(ctx.user.id, ctx.supabase);
      await callRpc(ctx.supabase, "auction_join_captain", {
        p_room_id: input.id,
        p_request_id: randomUUID(),
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
        players: poolSchema.optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const players = input.players
        ? await poolPayload(ctx.supabase, input.players)
        : null;
      await callRpc(ctx.supabase, "auction_update_lobby", {
        p_room_id: input.id,
        p_request_id: randomUUID(),
        p_team_name: input.teamName ?? null,
        p_starting_budget: input.budget ?? null,
        p_bid_seconds: input.bidSeconds ?? null,
        p_order_visible: input.showOrder ?? null,
        p_players: players,
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

  concede: protectedProcedure
    .input(roomIdSchema)
    .mutation(async ({ ctx, input }) => {
      await callRpc(ctx.supabase, "auction_concede", {
        p_room_id: input.id,
        p_request_id: randomUUID(),
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

  take: protectedProcedure
    .input(roomIdSchema)
    .mutation(async ({ ctx, input }) => {
      await callRpc(ctx.supabase, "auction_take", {
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
