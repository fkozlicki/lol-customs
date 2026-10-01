import { describe, expect, test } from "bun:test";
import {
  toChampionStatViews,
  toHeldTitles,
  toRatingPoints,
  toRelationsView,
  toSeasonMarkers,
  toSeasonSummaryViews,
} from "@/components/player/player-view";

/** Router outputs trimmed to what the mappers read; the full rows carry more. */
const player = (name: string | null, tag: string | null = "EUNE") => ({
  puuid: `puuid-${name ?? "anon"}-000000`,
  game_name: name,
  tag_line: tag,
  profile_icon: 1295,
});

describe("relations", () => {
  const relations = {
    teammates: {
      mostMatches: { player: player("Kestrel"), matches: 12 },
      mostWins: { player: player("Old Tom"), wins: 7, losses: 2 },
      mostLosses: null,
    },
    rivals: {
      bestRecord: null,
      worstRecord: null,
      mostKilled: { player: player(null), kills: 9 },
      mostKilledBy: null,
    },
  } as unknown as Parameters<typeof toRelationsView>[0];

  const view = toRelationsView(relations, { season: "2" });

  test("link each player's profile with the season in view", () => {
    expect(view.teammates.mostMatches?.href).toBe(
      "/players/Kestrel-EUNE?season=2",
    );
  });

  test("keep an empty record empty, for the row to say so", () => {
    expect(view.teammates.mostLosses).toBeNull();
    expect(view.rivals.bestRecord).toBeNull();
  });

  test("count what the query left out as zero", () => {
    expect(view.teammates.mostMatches).toMatchObject({
      matches: 12,
      wins: 0,
      losses: 0,
      kills: 0,
    });
  });

  test("fall back to the start of the puuid without a Riot ID", () => {
    expect(view.rivals.mostKilled?.name).toBe("puuid-an");
    expect(view.rivals.mostKilled?.href).toBe("#");
  });
});

describe("season summaries", () => {
  const summaries = [
    { seasonId: 11, wins: 10, losses: 4, rating: 1059.4 },
    { seasonId: 12, wins: 1, losses: 1, rating: 1001.6 },
    { seasonId: 99, wins: 0, losses: 3, rating: null },
  ] as unknown as Parameters<typeof toSeasonSummaryViews>[0];
  const seasons = [
    { id: 11, number: 1 },
    { id: 12, number: 2 },
  ] as unknown as Parameters<typeof toSeasonSummaryViews>[1]["seasons"];

  const views = toSeasonSummaryViews(summaries, { seasons, active: 12 });

  test("come newest first", () => {
    expect(views.map((view) => view.key)).toEqual(["99", "12", "11"]);
  });

  test("are numbered like the seasons, or by id for one the list lacks", () => {
    expect(views.map((view) => view.seasonNumber)).toEqual([99, 2, 1]);
  });

  test("mark the season on screen and link to each", () => {
    expect(views[1]).toMatchObject({ active: true, href: "?season=12" });
    expect(views[2]?.active).toBe(false);
  });

  test("round the rating and format the record", () => {
    expect(views[2]).toMatchObject({ rating: 1059, winrate: "71%" });
    expect(views[0]?.rating).toBe(0);
  });
});

describe("most played champions", () => {
  test("count losses as the matches not won, and the KDA per match", () => {
    const [view] = toChampionStatViews([
      { championId: 904, games: 4, wins: 3, kills: 20, deaths: 8, assists: 12 },
    ] as unknown as Parameters<typeof toChampionStatViews>[0]);
    expect(view).toEqual({
      championId: 904,
      matches: 4,
      wins: 3,
      losses: 1,
      kda: "5 / 2 / 3",
      winrate: "75%",
    });
  });
});

describe("rating history", () => {
  const history = [
    { rating_after: 1007, created_at: "2026-01-10T20:00:00Z" },
    { rating_after: 999, created_at: "2026-02-20T20:00:00Z" },
    { rating_after: 1012, created_at: null },
  ] as unknown as Parameters<typeof toRatingPoints>[0];

  test("numbers the points from one, in order", () => {
    expect(toRatingPoints(history).map((point) => point.index)).toEqual([
      1, 2, 3,
    ]);
  });

  test("names a point without a date by its place", () => {
    expect(toRatingPoints(history)[2]?.label).toBe("Game 3");
  });

  test("marks where a season began, after the first match only", () => {
    const markers = toSeasonMarkers(history, [
      { number: 1, startsAt: "2026-01-01T00:00:00Z" },
      { number: 2, startsAt: "2026-02-01T00:00:00Z" },
      { number: 3, startsAt: "2026-09-01T00:00:00Z" },
    ]);
    expect(markers).toEqual([{ seasonNumber: 2, index: 2 }]);
  });
});

describe("held titles", () => {
  const holder = (puuid: string, value: number) => ({
    player: { puuid },
    value,
  });
  const hallOfFame = {
    mvp: [holder("me", 12)],
    best_win_rate: [holder("someone-else", 0.9)],
    tilted: [holder("me", 6), holder("tied", 6)],
  } as unknown as Parameters<typeof toHeldTitles>[0];

  const titles = toHeldTitles(hallOfFame, "me", {
    locale: "en",
    href: "/hof?season=2",
    text: (id) => ({ title: `title:${id}`, description: `about:${id}` }),
  });

  test("are the titles the player holds, shared ones included, in the catalog's order", () => {
    expect(titles.map((title) => title.id)).toEqual(["mvp", "tilted"]);
  });

  test("carry their words, their value and their look", () => {
    expect(titles[0]).toEqual({
      id: "mvp",
      title: "title:mvp",
      description: "about:mvp",
      value: "12",
      href: "/hof?season=2",
      kind: "best",
      tone: "mvp",
    });
    expect(titles[1]).toMatchObject({ kind: "worst", tone: null });
  });
});
