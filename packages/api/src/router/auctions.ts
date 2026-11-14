import { AUCTION_POOL_SIZE, auctionPermissions } from "@v1/domain/auction";
import { parseRiotId, riotIdKey } from "@v1/domain/riot-id";
import {
  type AuctionListRoom,
  type AuctionRoomSnapshot,
  bidInAuction,
  createAuction,
  getAuctionRoom,
  joinAuction,
  listActiveAuctions,
  runAuctionAction,
  setAuctionReady,
  updateAuctionLobby,
} from "@v1/supabase/queries/auctions";
import { z } from "zod";
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

function normalizeRoom(raw: AuctionRoomSnapshot, signedIn: boolean) {
  const mySide = raw.permissions.side;
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
      ...auctionPermissions({
        status: raw.status,
        phase: raw.phase,
        currentBid: raw.currentBid,
        leadingSide: raw.leadingSide,
        captains: raw.captains,
        viewer: {
          signedIn,
          isCreator: raw.permissions.isCreator,
          side: mySide,
        },
      }),
    },
  };
}

export const auctionsRouter = createTRPCRouter({
  listActive: publicProcedure.query(async ({ ctx }) =>
    (await listActiveAuctions(ctx.supabase)).map(normalizeListItem),
  ),

  getRoom: publicProcedure.input(roomIdSchema).query(async ({ ctx, input }) => {
    const room = await getAuctionRoom(ctx.supabase, input.id);
    return room ? normalizeRoom(room, ctx.user !== null) : null;
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
      const id = await createAuction(ctx.supabase, input);
      return { id, roomId: id };
    }),

  joinCaptain: protectedProcedure
    .input(roomIdSchema.extend({ teamName: teamNameSchema.default("Team B") }))
    .mutation(async ({ ctx, input }) => {
      await joinAuction(ctx.supabase, input.id, input.teamName);
      return { ok: true };
    }),

  leaveCaptain: protectedProcedure
    .input(roomIdSchema)
    .mutation(async ({ ctx, input }) => {
      await runAuctionAction(ctx.supabase, input.id, "leaveCaptain");
      return { ok: true };
    }),

  removeCaptain: protectedProcedure
    .input(roomIdSchema)
    .mutation(async ({ ctx, input }) => {
      await runAuctionAction(ctx.supabase, input.id, "removeCaptain");
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
    .mutation(async ({ ctx, input: { id, ...lobby } }) => {
      await updateAuctionLobby(ctx.supabase, id, lobby);
      return { ok: true };
    }),

  setReady: protectedProcedure
    .input(roomIdSchema.extend({ ready: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      await setAuctionReady(ctx.supabase, input.id, input.ready);
      return { ok: true };
    }),

  bid: protectedProcedure
    .input(roomIdSchema.extend({ amount: z.int().positive() }))
    .mutation(async ({ ctx, input }) => {
      await bidInAuction(ctx.supabase, input.id, input.amount);
      return { ok: true };
    }),

  concede: protectedProcedure
    .input(roomIdSchema)
    .mutation(async ({ ctx, input }) => {
      await runAuctionAction(ctx.supabase, input.id, "concede");
      return { ok: true };
    }),

  pass: protectedProcedure
    .input(roomIdSchema)
    .mutation(async ({ ctx, input }) => {
      await runAuctionAction(ctx.supabase, input.id, "pass");
      return { ok: true };
    }),

  take: protectedProcedure
    .input(roomIdSchema)
    .mutation(async ({ ctx, input }) => {
      await runAuctionAction(ctx.supabase, input.id, "take");
      return { ok: true };
    }),

  cancel: protectedProcedure
    .input(roomIdSchema)
    .mutation(async ({ ctx, input }) => {
      await runAuctionAction(ctx.supabase, input.id, "cancel");
      return { ok: true };
    }),
});
