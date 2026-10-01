import { describe, expect, test } from "bun:test";
import type { AuctionRoomSnapshot } from "@/components/auctions/auction-contract";
import {
  toAuctionEventViews,
  toAuctionStageView,
  toLobbyView,
  toTeamRosterView,
  toUpcomingOrder,
} from "@/components/auctions/auction-room-view";

const player = (
  id: string,
  gameName: string,
  more: Partial<AuctionRoomSnapshot["players"][number]> = {},
) => ({
  id,
  gameName,
  tagLine: "EUNE",
  soloTier: null,
  soloDivision: null,
  soloRankLabel: "",
  teamSide: null,
  purchasePrice: null,
  revealed: false,
  drawPosition: null,
  ...more,
});

const permissions = {
  isCreator: false,
  mySide: null,
  canJoin: false,
  canLeave: false,
  canRemoveCaptain: false,
  canEditLobby: false,
  canReady: false,
  canBid: false,
  canConcede: false,
  canDecideFreeAuction: false,
  canCancel: false,
};

/** A room two rounds in: Night Owls bought Kestrel, Wren is on sale, Night Owls lead. */
const room = (changes: Partial<AuctionRoomSnapshot> = {}) =>
  ({
    id: "room-1",
    status: "active",
    phase: "bidding",
    budget: 20,
    bidSeconds: 30,
    showOrder: true,
    currentPlayerId: "p2",
    currentBid: 4,
    currentLeaderSide: "A",
    roundNumber: 2,
    countdownEndsAt: null,
    phaseEndsAt: "2026-09-30T20:00:30Z",
    serverNow: "2026-09-30T20:00:10Z",
    captains: [
      {
        side: "A",
        teamName: "Night Owls",
        profileNickname: "kasia",
        ready: true,
        budgetRemaining: 15,
        isCurrentUser: false,
      },
    ],
    players: [
      player("p1", "Kestrel", {
        teamSide: "A",
        purchasePrice: 5,
        soloTier: "gold",
        soloRankLabel: "gold IV",
        drawPosition: 1,
      }),
      player("p2", "Wren", { drawPosition: 2 }),
      player("p3", "Quill", { drawPosition: 4 }),
      player("p4", "Bramble", { drawPosition: 3 }),
    ],
    events: [
      {
        id: 1,
        type: "sold",
        side: "A",
        playerId: "p1",
        amount: 5,
        payload: {},
        createdAt: "2026-09-30T19:59:00Z",
      },
      {
        id: 2,
        type: "opening_bid",
        side: "B",
        playerId: "p2",
        amount: 1,
        payload: {},
        createdAt: "2026-09-30T19:59:40Z",
      },
      {
        id: 3,
        type: "ready_changed",
        side: "A",
        playerId: null,
        amount: null,
        payload: { ready: false },
        createdAt: "2026-09-30T19:59:50Z",
      },
      {
        id: 4,
        type: "expired",
        side: null,
        playerId: "gone",
        amount: null,
        payload: {},
        createdAt: "2026-09-30T19:59:55Z",
      },
    ],
    permissions,
    ...changes,
  }) as unknown as AuctionRoomSnapshot;

describe("a team's roster", () => {
  test("carries the captain, the budget left and the players bought, at their price", () => {
    expect(toTeamRosterView(room(), "A")).toEqual({
      side: "A",
      teamName: "Night Owls",
      captainName: "kasia",
      budget: 20,
      remaining: 15,
      leading: true,
      slots: 4,
      players: [
        {
          id: "p1",
          name: "Kestrel",
          rankTier: "gold",
          rankLabel: "gold IV",
          price: 5,
        },
      ],
    });
  });

  test("with the seat open, has the whole budget and no name for the recipe to fill in", () => {
    expect(toTeamRosterView(room(), "B")).toMatchObject({
      teamName: null,
      captainName: null,
      remaining: 20,
      leading: false,
      players: [],
    });
  });
});

describe("the stage", () => {
  test("shows the player on sale, the round, the leader and who opened", () => {
    expect(toAuctionStageView(room())).toEqual({
      phase: "bidding",
      round: { number: 2, total: 8 },
      leadingTeam: "Night Owls",
      player: { id: "p2", name: "Wren", rankTier: null, rankLabel: null },
      price: 4,
      openedBy: "B",
      countdown: {
        deadline: "2026-09-30T20:00:30Z",
        serverNow: "2026-09-30T20:00:10Z",
        durationSeconds: 30,
      },
    });
  });

  test("while a sale settles, drops the clock and who opened", () => {
    const stage = toAuctionStageView(room({ phase: "sold_pause" }));
    expect(stage.countdown).toBeNull();
    expect(stage.openedBy).toBeNull();
  });

  test("before the first round, has no round and no player", () => {
    const stage = toAuctionStageView(
      room({ roundNumber: 0, currentPlayerId: null, currentBid: null }),
    );
    expect(stage).toMatchObject({ round: null, player: null, price: 0 });
  });
});

describe("the event feed", () => {
  const events = toAuctionEventViews(room(), { locale: "en" });

  test("comes newest first", () => {
    expect(events.map((event) => event.key)).toEqual(["4", "3", "2", "1"]);
  });

  test("names the team and the player each event concerns", () => {
    expect(events[3]).toMatchObject({
      kind: "sold",
      team: "Night Owls",
      player: "Kestrel",
      amount: 5,
    });
    expect(events[2]).toMatchObject({ team: "B", player: "Wren" });
  });

  test("tells readiness withdrawn from readiness given", () => {
    expect(events[1]?.kind).toBe("unready");
  });

  test("leaves a player it cannot find unnamed, and an event it has no words for as the room's creation", () => {
    expect(events[0]).toMatchObject({
      kind: "created",
      player: null,
      team: "",
    });
  });
});

test("the upcoming order lists the players still to be drawn, in draw order, only when the room shows it", () => {
  expect(toUpcomingOrder(room())).toEqual(["Bramble", "Quill"]);
  expect(toUpcomingOrder(room({ showOrder: false }))).toBeNull();
});

describe("the lobby", () => {
  const lobby = (
    mySide: "A" | "B" | null,
    changes: Partial<AuctionRoomSnapshot> = {},
    rights: Partial<typeof permissions> = {},
  ) =>
    toLobbyView(
      room({
        status: "waiting",
        permissions: { ...permissions, mySide, ...rights },
        ...changes,
      }),
    );

  test("offers the open seat to a visitor while the room waits", () => {
    expect(lobby(null).teams.B.vacancy).toBe("join");
    expect(lobby(null, { status: "countdown" }).teams.B.vacancy).toBe("open");
  });

  test("has Team A's captain invite someone to the open seat", () => {
    expect(lobby("A").teams.B.vacancy).toBe("invite");
  });

  test("lets a captain rename only their own team", () => {
    const view = lobby("A");
    expect(view.teams.A.canRename).toBe(true);
    expect(view.teams.B.canRename).toBe(false);
  });

  test("gives the viewer a ready toggle only when they captain a team", () => {
    expect(lobby("A", {}, { canReady: true }).ready).toEqual({
      ready: true,
      allowed: true,
    });
    expect(lobby(null).ready).toBeNull();
  });

  test("lets Team B's captain leave, and the creator remove them", () => {
    const withB = {
      captains: [
        ...room().captains,
        {
          side: "B" as const,
          teamName: "Team B",
          profileNickname: "ola",
          ready: false,
          budgetRemaining: 20,
          isCurrentUser: true,
        },
      ],
    };
    expect(lobby("B", withB, { canLeave: true }).teams.B.seatAction).toBe(
      "leave",
    );
    expect(
      lobby("A", withB, { canRemoveCaptain: true }).teams.B.seatAction,
    ).toBe("remove");
    expect(lobby("A", withB).teams.A.seatAction).toBeNull();
  });

  test("counts the countdown down from five seconds", () => {
    expect(
      lobby("A", { countdownEndsAt: "2026-09-30T20:00:15Z" }).countdown,
    ).toEqual({
      deadline: "2026-09-30T20:00:15Z",
      serverNow: "2026-09-30T20:00:10Z",
      durationSeconds: 5,
    });
  });
});
