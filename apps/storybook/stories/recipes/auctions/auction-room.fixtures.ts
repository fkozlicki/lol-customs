/** An auction room shaped the way its recipes take it. Names invented. */
import type {
  AuctionEventView,
  AuctionPlayerView,
  AuctionStageView,
  LobbyView,
  TeamRosterView,
} from "@v1/ui/recipes/auctions/auction-room-view";

const player = (
  id: string,
  name: string,
  rankTier: string | null = null,
  rankLabel: string | null = null,
): AuctionPlayerView => ({ id, name, rankTier, rankLabel });

export const POOL: AuctionPlayerView[] = [
  player("p1", "Kestrel", "diamond", "diamond IV"),
  player("p2", "Old Tom", "emerald", "emerald I"),
  player("p3", "Nightjar"),
  player("p4", "Sutokopter", "emerald", "emerald II"),
  player("p5", "Wren", "gold", "gold I"),
  player("p6", "Bramble", "platinum", "platinum III"),
  player("p7", "Quill", "master", "master"),
  player("p8", "Emberly", "silver", "silver II"),
];

const bought = (index: number, price: number | null) => ({
  ...POOL[index]!,
  price,
});

export const ROSTERS: Record<"A" | "B", TeamRosterView> = {
  A: {
    side: "A",
    teamName: "Night Owls",
    captainName: "kasia",
    budget: 20,
    remaining: 9,
    leading: true,
    slots: 4,
    players: [bought(0, 7), bought(3, 4)],
  },
  B: {
    side: "B",
    teamName: "Pierogi Gang",
    captainName: "ola",
    budget: 20,
    remaining: 14,
    leading: false,
    slots: 4,
    players: [bought(1, 6)],
  },
};

/** Both rosters full, one player given away in a free auction. */
export const FINAL_ROSTERS: Record<"A" | "B", TeamRosterView> = {
  A: {
    ...ROSTERS.A,
    leading: false,
    remaining: 0,
    players: [bought(0, 7), bought(3, 4), bought(4, 8), bought(7, 1)],
  },
  B: {
    ...ROSTERS.B,
    remaining: 6,
    players: [bought(1, 6), bought(2, 3), bought(5, 5), bought(6, null)],
  },
};

const runningClock = () => {
  const now = new Date();
  return {
    deadline: new Date(now.getTime() + 21_000).toISOString(),
    serverNow: now.toISOString(),
    durationSeconds: 30,
  };
};

export const stage = (
  changes: Partial<AuctionStageView> = {},
): AuctionStageView => ({
  phase: "bidding",
  round: { number: 4, total: 8 },
  leadingTeam: "Night Owls",
  player: POOL[4]!,
  price: 5,
  openedBy: "Pierogi Gang",
  countdown: runningClock(),
  ...changes,
});

const event = (
  key: number,
  kind: AuctionEventView["kind"],
  more: Partial<AuctionEventView> = {},
): AuctionEventView => ({
  key: String(key),
  kind,
  time: `20:${String(10 + key).padStart(2, "0")}`,
  team: "",
  player: null,
  amount: 0,
  ...more,
});

/** Every kind of line the feed can say, newest first. */
export const EVENTS: AuctionEventView[] = [
  event(19, "completed"),
  event(18, "auto_assigned", { team: "Pierogi Gang", player: "Quill" }),
  event(17, "pass", { team: "Night Owls", player: "Quill" }),
  event(16, "sold", { team: "Night Owls", player: "Wren", amount: 8 }),
  event(15, "concede", { team: "Pierogi Gang", player: "Wren" }),
  event(14, "bid", { team: "Night Owls", player: "Wren", amount: 8 }),
  event(13, "opening_bid", { team: "Pierogi Gang", player: "Wren" }),
  event(12, "player_revealed", { player: "Wren" }),
  event(11, "auction_started"),
  event(10, "countdown_started"),
  event(9, "countdown_cancelled"),
  event(8, "ready", { team: "Pierogi Gang" }),
  event(7, "unready", { team: "Night Owls" }),
  event(6, "lobby_updated", { team: "Night Owls" }),
  event(5, "captain_removed"),
  event(4, "captain_left"),
  event(3, "captain_joined", { team: "Pierogi Gang" }),
  event(2, "cancelled"),
  event(1, "created"),
];

export const lobby = (changes: Partial<LobbyView> = {}): LobbyView => ({
  countdown: null,
  teams: {
    A: {
      side: "A",
      teamName: "Night Owls",
      captain: { name: "kasia", ready: true },
      canRename: false,
      seatAction: null,
      vacancy: "open",
    },
    B: {
      side: "B",
      teamName: null,
      captain: null,
      canRename: false,
      seatAction: null,
      vacancy: "join",
    },
  },
  ready: null,
  pool: POOL,
  canEditPool: false,
  ...changes,
});
