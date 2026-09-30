import { AUCTION_POOL_SIZE } from "@v1/domain/auction";
import type {
  AuctionEventKind,
  AuctionEventView,
  AuctionPlayerView,
  AuctionRoomHeaderView,
  AuctionStageView,
  LobbyTeamView,
  LobbyView,
  TeamRosterView,
} from "@v1/ui/recipes/auctions/auction-room-view";
import {
  type AuctionEvent,
  type AuctionPlayer,
  type AuctionRoomSnapshot,
  type AuctionSide,
  captainFor,
  playersFor,
} from "./auction-contract";

/** The lobby's countdown, which the server starts once both captains are ready. */
const LOBBY_COUNTDOWN_SECONDS = 5;

/** A side by its captain's team name, or by its letter while the seat is open. */
function teamLabel(room: AuctionRoomSnapshot, side: AuctionSide): string {
  return captainFor(room, side)?.teamName ?? side;
}

export function toAuctionPlayerView(player: AuctionPlayer): AuctionPlayerView {
  return {
    id: player.id,
    name: player.gameName,
    rankTier: player.soloTier,
    rankLabel: player.soloRankLabel || null,
  };
}

export function toAuctionRoomHeaderView(
  room: AuctionRoomSnapshot,
): AuctionRoomHeaderView {
  return {
    status: room.status,
    teamA: captainFor(room, "A")?.teamName ?? null,
    teamB: captainFor(room, "B")?.teamName ?? null,
    canCancel: room.permissions.canCancel,
  };
}

export function toTeamRosterView(
  room: AuctionRoomSnapshot,
  side: AuctionSide,
): TeamRosterView {
  const captain = captainFor(room, side);
  return {
    side,
    teamName: captain?.teamName ?? null,
    captainName: captain?.profileNickname ?? null,
    budget: room.budget,
    remaining: captain?.budgetRemaining ?? room.budget,
    leading: room.currentLeaderSide === side,
    slots: AUCTION_POOL_SIZE / 2,
    players: playersFor(room, side).map((player) => ({
      ...toAuctionPlayerView(player),
      price: player.purchasePrice,
    })),
  };
}

export function toTeamRosterViews(
  room: AuctionRoomSnapshot,
): Record<AuctionSide, TeamRosterView> {
  return { A: toTeamRosterView(room, "A"), B: toTeamRosterView(room, "B") };
}

export function toAuctionStageView(
  room: AuctionRoomSnapshot,
): AuctionStageView {
  const current = room.players.find(
    (player) => player.id === room.currentPlayerId,
  );
  const opening = [...room.events]
    .reverse()
    .find(
      (event) =>
        event.type === "opening_bid" && event.playerId === room.currentPlayerId,
    );
  const settling = room.phase === "sold_pause";
  return {
    phase: room.phase ?? "bidding",
    round:
      room.roundNumber > 0
        ? { number: room.roundNumber, total: AUCTION_POOL_SIZE }
        : null,
    leadingTeam: room.currentLeaderSide
      ? teamLabel(room, room.currentLeaderSide)
      : null,
    player: current ? toAuctionPlayerView(current) : null,
    price: room.currentBid ?? 0,
    openedBy: opening?.side && !settling ? teamLabel(room, opening.side) : null,
    countdown:
      room.phaseEndsAt && !settling
        ? {
            deadline: room.phaseEndsAt,
            serverNow: room.serverNow,
            durationSeconds: room.bidSeconds,
          }
        : null,
  };
}

const EVENT_KINDS: Partial<Record<AuctionEvent["type"], AuctionEventKind>> = {
  created: "created",
  captain_joined: "captain_joined",
  captain_left: "captain_left",
  captain_removed: "captain_removed",
  lobby_updated: "lobby_updated",
  countdown_started: "countdown_started",
  countdown_cancelled: "countdown_cancelled",
  auction_started: "auction_started",
  player_revealed: "player_revealed",
  opening_bid: "opening_bid",
  bid: "bid",
  concede: "concede",
  pass: "pass",
  sold: "sold",
  auto_assigned: "auto_assigned",
  cancelled: "cancelled",
  completed: "completed",
};

function eventKind(event: AuctionEvent): AuctionEventKind {
  if (event.type === "ready_changed") {
    return event.payload.ready ? "ready" : "unready";
  }
  // The feed has no words for the rest (a room expiring); it says the room was created, as it did.
  return EVENT_KINDS[event.type] ?? "created";
}

/** The room's events, newest first, with the team and player each concerns named. */
export function toAuctionEventViews(
  room: AuctionRoomSnapshot,
  { locale }: { locale: string },
): AuctionEventView[] {
  const names = new Map(room.players.map((p) => [p.id, p.gameName]));
  return [...room.events].reverse().map((event) => ({
    key: String(event.id),
    kind: eventKind(event),
    time: new Date(event.createdAt).toLocaleTimeString(locale, {
      hour: "2-digit",
      minute: "2-digit",
    }),
    team: event.side ? teamLabel(room, event.side) : "",
    player: (event.playerId && names.get(event.playerId)) || null,
    amount: event.amount ?? 0,
  }));
}

/** The players still to be drawn, in draw order; null for a room that keeps its order hidden. */
export function toUpcomingOrder(room: AuctionRoomSnapshot): string[] | null {
  if (!room.showOrder) return null;
  return room.players
    .filter(
      (player) =>
        player.drawPosition != null &&
        !player.teamSide &&
        player.id !== room.currentPlayerId,
    )
    .sort((a, b) => (a.drawPosition ?? 0) - (b.drawPosition ?? 0))
    .map((player) => player.gameName);
}

function toLobbyTeamView(
  room: AuctionRoomSnapshot,
  side: AuctionSide,
): LobbyTeamView {
  const captain = captainFor(room, side);
  const { mySide, canLeave, canRemoveCaptain } = room.permissions;
  return {
    side,
    teamName: captain?.teamName ?? null,
    captain: captain
      ? { name: captain.profileNickname, ready: captain.ready }
      : null,
    canRename: captain !== undefined && side === mySide,
    // Team A's captain created the room and stays; only Team B's seat changes hands.
    seatAction:
      captain && side === "B"
        ? canLeave
          ? "leave"
          : canRemoveCaptain
            ? "remove"
            : null
        : null,
    vacancy:
      mySide === null && room.status === "waiting"
        ? "join"
        : mySide === "A"
          ? "invite"
          : "open",
  };
}

export function toLobbyView(room: AuctionRoomSnapshot): LobbyView {
  const me = room.permissions.mySide
    ? captainFor(room, room.permissions.mySide)
    : undefined;
  return {
    countdown: room.countdownEndsAt
      ? {
          deadline: room.countdownEndsAt,
          serverNow: room.serverNow,
          durationSeconds: LOBBY_COUNTDOWN_SECONDS,
        }
      : null,
    teams: { A: toLobbyTeamView(room, "A"), B: toLobbyTeamView(room, "B") },
    ready: me ? { ready: me.ready, allowed: room.permissions.canReady } : null,
    pool: room.players.map(toAuctionPlayerView),
    canEditPool: room.permissions.canEditLobby,
  };
}
