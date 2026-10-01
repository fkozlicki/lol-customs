/**
 * A profile's side panels, shaped the way the player recipes take them, for stories. Made up by hand:
 * the names are invented, the numbers the size real ones are.
 */
import type {
  ChampionStatView,
  HeldTitleView,
  RatingPointView,
  RelationsView,
  RelationView,
  SeasonSummaryView,
} from "@v1/ui/recipes/player/player-view";

const relation = (
  name: string,
  figures: Partial<Omit<RelationView, "name" | "href">>,
): RelationView => ({
  name,
  href: `/players/${encodeURIComponent(name)}-EUNE`,
  iconId: 1295,
  matches: 0,
  wins: 0,
  losses: 0,
  kills: 0,
  ...figures,
});

export const RELATIONS: RelationsView = {
  teammates: {
    mostMatches: relation("Kestrel", { matches: 14 }),
    mostWins: relation("Old Tom", { wins: 9, losses: 2 }),
    mostLosses: relation("Nightjar", { wins: 3, losses: 7 }),
  },
  rivals: {
    bestRecord: relation("Bramble", { wins: 6, losses: 1 }),
    worstRecord: relation("Quill", { wins: 1, losses: 5 }),
    mostKilled: relation("Wren", { kills: 23 }),
    mostKilledBy: relation("Emberly", { kills: 17 }),
  },
};

/** A player with fewer than three matches against anyone. */
export const NO_RELATIONS: RelationsView = {
  teammates: { mostMatches: null, mostWins: null, mostLosses: null },
  rivals: {
    bestRecord: null,
    worstRecord: null,
    mostKilled: null,
    mostKilledBy: null,
  },
};

export const TITLES: HeldTitleView[] = [
  {
    id: "mvp",
    title: "MVP",
    description: "Matches as MVP",
    value: "4",
    href: "/hof",
    kind: "best",
    tone: "mvp",
  },
  {
    id: "most_kills",
    title: "Butcher",
    description: "Kills per match",
    value: "9.4",
    href: "/hof",
    kind: "best",
    tone: null,
  },
  {
    id: "tilted",
    title: "Tilted",
    description: "Longest losing streak",
    value: "6",
    href: "/hof",
    kind: "worst",
    tone: null,
  },
];

export const SEASON_SUMMARIES: SeasonSummaryView[] = [
  {
    key: "2",
    seasonNumber: 2,
    href: "?season=2",
    active: true,
    wins: 6,
    losses: 3,
    winrate: "67%",
    rating: 1034,
  },
  {
    key: "1",
    seasonNumber: 1,
    href: "?season=1",
    active: false,
    wins: 10,
    losses: 4,
    winrate: "71%",
    rating: 1059,
  },
];

export const CHAMPIONS: ChampionStatView[] = [
  {
    championId: 904,
    matches: 6,
    wins: 4,
    losses: 2,
    kda: "7.2 / 5.1 / 8.3",
    winrate: "67%",
  },
  {
    championId: 254,
    matches: 4,
    wins: 1,
    losses: 3,
    kda: "4.5 / 7.0 / 9.8",
    winrate: "25%",
  },
  {
    championId: 711,
    matches: 3,
    wins: 3,
    losses: 0,
    kda: "9.0 / 3.3 / 6.7",
    winrate: "100%",
  },
];

/** Twenty matches drifting up from the 1000 everyone starts at. */
export const RATING_POINTS: RatingPointView[] = [
  1007, 1014, 1006, 999, 1008, 1016, 1023, 1015, 1022, 1031, 1024, 1017, 1026,
  1034, 1041, 1033, 1040, 1048, 1039, 1046,
].map((rating, i) => ({
  index: i + 1,
  rating,
  label: `Feb ${i + 1}, 21:30`,
}));
