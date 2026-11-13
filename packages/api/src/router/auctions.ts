import { randomUUID } from "node:crypto";
import { TRPCError } from "@trpc/server";
import { AUCTION_POOL_SIZE } from "@v1/domain/auction";
import { formatRank } from "@v1/domain/rank";
import { parseRiotId, riotIdKey } from "@v1/domain/riot-id";
import {
  type AuctionListRoom,
  type AuctionRoomSnapshot,
  auctionRoomSnapshot,
  getAuctionRoom,
  listActiveAuctions,
} from "@v1/supabase/queries/auctions";
import type { AuctionPoolEntry, Client } from "@v1/supabase/types";
import { z } from "zod";
import { isDatabaseError, toTRPCError } from "../errors";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";

const roomIdSchema = z.object({ id: z.uuid() });

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

interface AuctionFunctionError {
  message: string;
}

/**
 * An auction function's error. One that names an `AUCTION_*` rule gets its message; anything else
 * goes through the shared mapper, so the database's own text never reaches the client.
 */
function domainError(error: AuctionFunctionError): TRPCError {
  const domainCode = error.message.match(/AUCTION_[A-Z_]+/)?.[0];
  if (!domainCode) {
    return isDatabaseError(error)
      ? toTRPCError(error)
      : new TRPCError({ code: "INTERNAL_SERVER_ERROR", cause: error });
  }
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
  const message = messages[domainCode] ?? domainCode;

  if (domainCode.includes("NOT_FOUND")) {
    return new TRPCError({ code: "NOT_FOUND", message });
  }
  if (
    domainCode.includes("FORBIDDEN") ||
    domainCode.includes("NOT_ALLOWED") ||
    domainCode.includes("PERMISSION") ||
    domainCode.includes("PROFILE_REQUIRED")
  ) {
    return new TRPCError({ code: "FORBIDDEN", message });
  }
  if (
    domainCode.includes("ALREADY") ||
    domainCode.includes("TAKEN") ||
    domainCode.includes("STALE") ||
    domainCode.includes("DEADLINE")
  ) {
    return new TRPCError({ code: "CONFLICT", message });
  }
  return new TRPCError({ code: "BAD_REQUEST", message });
}

/** Runs an auction function for its effect; its domain errors become tRPC errors. */
async function runAuctionFunction(
  call: PromiseLike<{ error: AuctionFunctionError | null }>,
): Promise<void> {
  const { error } = await call;
  if (error) throw domainError(error);
}

async function requireProfile(supabase: Client, userId: string) {
  const { data, error } = await supabase
    .from("user_profiles")
    .select("id")
    .eq("id", userId)
    .maybeSingle();

  if (error) throw error;
  if (!data) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Create a profile before joining an auction.",
    });
  }
}

function normalizeListItem(raw: AuctionListRoom) {
  return {
    id: raw.id,
    status: raw.status,
    isMine: raw.isMine,
    mySide: raw.mySide,
    phase: raw.phase,
    teamA: { teamName: raw.teamA, captain: raw.captainA },
    teamB: { teamName: raw.teamB, captain: raw.captainB },
    currentPlayer: raw.currentPlayer
      ? (parseRiotId(raw.currentPlayer) ?? {
          gameName: raw.currentPlayer,
          tagLine: "",
        })
      : null,
    currentBid: raw.currentBid || null,
    countdownEndsAt: raw.countdownEndsAt,
    phaseEndsAt: raw.phase === "bidding" ? raw.bidDeadline : raw.phaseDeadline,
    updatedAt: raw.updatedAt,
  };
}

function normalizeRoom(raw: AuctionRoomSnapshot) {
  const mySide = raw.permissions.side;
  const hasCaptainB = raw.captains.some((captain) => captain.side === "B");
  const myBudget =
    raw.captains.find((captain) => captain.side === mySide)?.budgetRemaining ??
    null;
  const active = raw.status === "active" && mySide !== null;
  const leading = raw.leadingSide === mySide;
  const inLobby = raw.status === "waiting" || raw.status === "countdown";
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
      soloTier: player.rank.soloTier,
      soloDivision: player.rank.soloDivision,
      soloRankLabel: player.rank.soloRankLabel,
      teamSide: player.assignedSide,
      purchasePrice: player.purchasePrice,
      revealed: player.revealed,
      drawPosition: player.drawPosition,
    })),
    events: raw.events.map((event) => ({
      id: event.id,
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
      canLeave: mySide === "B" && inLobby,
      canRemoveCaptain: raw.permissions.isCreator && hasCaptainB && inLobby,
      canEditLobby: raw.permissions.canEditLobby,
      canReady: mySide !== null && hasCaptainB && inLobby,
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

/** The pool with each player's latest ladder rank; players outside the ladder are unranked. */
async function poolPayload(
  supabase: Client,
  pool: z.infer<typeof poolSchema>,
): Promise<AuctionPoolEntry[]> {
  const [players, ranks] = await Promise.all([
    supabase.from("players").select("puuid, game_name, tag_line"),
    supabase.rpc("player_latest_ranks"),
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

export const auctionsRouter = createTRPCRouter({
  listActive: publicProcedure.query(async ({ ctx }) =>
    (await listActiveAuctions(ctx.supabase)).map(normalizeListItem),
  ),

  getRoom: publicProcedure.input(roomIdSchema).query(async ({ ctx, input }) => {
    const room = await getAuctionRoom(ctx.supabase, input.id);
    return room ? normalizeRoom(room) : null;
  }),

  create: protectedProcedure
    .input(
      z.object({
        players: poolSchema,
        teamName: teamNameSchema.default("Team A"),
        budget: z.int().min(4).max(100).default(20),
        bidSeconds: z.int().min(10).max(60).default(30),
        showOrder: z.boolean().default(false),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await requireProfile(ctx.supabase, ctx.user.id);
      const { data, error } = await ctx.supabase.rpc("auction_create_room", {
        p_request_id: randomUUID(),
        p_players: await poolPayload(ctx.supabase, input.players),
        p_team_name: input.teamName,
        p_starting_budget: input.budget,
        p_bid_seconds: input.bidSeconds,
        p_order_visible: input.showOrder,
      });
      if (error) throw domainError(error);
      const { id } = auctionRoomSnapshot.parse(data);
      return { id, roomId: id };
    }),

  joinCaptain: protectedProcedure
    .input(roomIdSchema.extend({ teamName: teamNameSchema.default("Team B") }))
    .mutation(async ({ ctx, input }) => {
      await requireProfile(ctx.supabase, ctx.user.id);
      await runAuctionFunction(
        ctx.supabase.rpc("auction_join_captain", {
          p_room_id: input.id,
          p_request_id: randomUUID(),
          p_team_name: input.teamName,
        }),
      );
      return { ok: true };
    }),

  leaveCaptain: protectedProcedure
    .input(roomIdSchema)
    .mutation(async ({ ctx, input }) => {
      await runAuctionFunction(
        ctx.supabase.rpc("auction_leave_captain", {
          p_room_id: input.id,
          p_request_id: randomUUID(),
        }),
      );
      return { ok: true };
    }),

  removeCaptain: protectedProcedure
    .input(roomIdSchema)
    .mutation(async ({ ctx, input }) => {
      await runAuctionFunction(
        ctx.supabase.rpc("auction_remove_captain", {
          p_room_id: input.id,
          p_request_id: randomUUID(),
        }),
      );
      return { ok: true };
    }),

  updateLobby: protectedProcedure
    .input(
      roomIdSchema.extend({
        teamName: teamNameSchema.optional(),
        budget: z.int().min(4).max(100).optional(),
        bidSeconds: z.int().min(10).max(60).optional(),
        showOrder: z.boolean().optional(),
        players: poolSchema.optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const players = input.players
        ? await poolPayload(ctx.supabase, input.players)
        : null;
      await runAuctionFunction(
        ctx.supabase.rpc("auction_update_lobby", {
          p_room_id: input.id,
          p_request_id: randomUUID(),
          p_team_name: input.teamName ?? null,
          p_starting_budget: input.budget ?? null,
          p_bid_seconds: input.bidSeconds ?? null,
          p_order_visible: input.showOrder ?? null,
          p_players: players,
        }),
      );
      return { ok: true };
    }),

  setReady: protectedProcedure
    .input(roomIdSchema.extend({ ready: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      await runAuctionFunction(
        ctx.supabase.rpc("auction_set_ready", {
          p_room_id: input.id,
          p_request_id: randomUUID(),
          p_ready: input.ready,
        }),
      );
      return { ok: true };
    }),

  bid: protectedProcedure
    .input(roomIdSchema.extend({ amount: z.int().positive() }))
    .mutation(async ({ ctx, input }) => {
      await runAuctionFunction(
        ctx.supabase.rpc("auction_bid", {
          p_room_id: input.id,
          p_request_id: randomUUID(),
          p_amount: input.amount,
        }),
      );
      return { ok: true };
    }),

  concede: protectedProcedure
    .input(roomIdSchema)
    .mutation(async ({ ctx, input }) => {
      await runAuctionFunction(
        ctx.supabase.rpc("auction_concede", {
          p_room_id: input.id,
          p_request_id: randomUUID(),
        }),
      );
      return { ok: true };
    }),

  pass: protectedProcedure
    .input(roomIdSchema)
    .mutation(async ({ ctx, input }) => {
      await runAuctionFunction(
        ctx.supabase.rpc("auction_pass", {
          p_room_id: input.id,
          p_request_id: randomUUID(),
        }),
      );
      return { ok: true };
    }),

  take: protectedProcedure
    .input(roomIdSchema)
    .mutation(async ({ ctx, input }) => {
      await runAuctionFunction(
        ctx.supabase.rpc("auction_take", {
          p_room_id: input.id,
          p_request_id: randomUUID(),
        }),
      );
      return { ok: true };
    }),

  cancel: protectedProcedure
    .input(roomIdSchema)
    .mutation(async ({ ctx, input }) => {
      await runAuctionFunction(
        ctx.supabase.rpc("auction_cancel", {
          p_room_id: input.id,
          p_request_id: randomUUID(),
        }),
      );
      return { ok: true };
    }),
});
