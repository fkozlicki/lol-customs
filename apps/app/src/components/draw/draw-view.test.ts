import { describe, expect, test } from "bun:test";
import {
  ladderCandidates,
  toDrawnTeamView,
  toDrawPlayerView,
} from "./draw-view";

type Ladder = Parameters<typeof ladderCandidates>[0];

const ladder = [
  {
    puuid: "1",
    game_name: "Kestrel",
    tag_line: "EUNE",
    rank_tier: "GOLD",
    rank_division: "IV",
  },
  {
    puuid: "2",
    game_name: "Old Tom",
    tag_line: "0001",
    rank_tier: null,
    rank_division: null,
  },
  {
    puuid: "3",
    game_name: "Nightjar",
    tag_line: null,
    rank_tier: null,
    rank_division: null,
  },
  {
    puuid: "4",
    game_name: "Kestrel II",
    tag_line: "EUW",
    rank_tier: "MASTER",
    rank_division: "I",
  },
] as unknown as Ladder;

describe("ladder candidates", () => {
  test("leave out players without a Riot ID", () => {
    const names = ladderCandidates(ladder, { roster: [], search: "" }).map(
      (p) => p.gameName,
    );
    expect(names).toEqual(["Kestrel", "Old Tom", "Kestrel II"]);
  });

  test("leave out the roster, by Riot ID in any case", () => {
    const roster = [
      {
        gameName: "kestrel",
        tagLine: "eune",
        rankTier: null,
        rankDivision: null,
      },
    ];
    const names = ladderCandidates(ladder, { roster, search: "" }).map(
      (p) => p.gameName,
    );
    expect(names).toEqual(["Old Tom", "Kestrel II"]);
  });

  test("match the search anywhere in the name, ignoring case and spaces around it", () => {
    const names = ladderCandidates(ladder, {
      roster: [],
      search: "  KES ",
    }).map((p) => p.gameName);
    expect(names).toEqual(["Kestrel", "Kestrel II"]);
  });
});

describe("draw views", () => {
  test("label a player's rank, or leave it for the row to call unranked", () => {
    expect(
      toDrawPlayerView({
        gameName: "Kestrel",
        tagLine: "EUNE",
        rankTier: "gold",
        rankDivision: "IV",
      }),
    ).toMatchObject({
      name: "Kestrel",
      rankTier: "gold",
      rankLabel: "gold IV",
    });
    expect(
      toDrawPlayerView({
        gameName: "Wren",
        tagLine: "PL1",
        rankTier: null,
        rankDivision: null,
      }).rankLabel,
    ).toBeNull();
  });

  test("keep each drawn player's role and captaincy", () => {
    const view = toDrawnTeamView({
      avgRankLabel: "Gold II",
      avgRankTier: "GOLD",
      players: [
        {
          gameName: "Kestrel",
          tagLine: "EUNE",
          rankTier: null,
          rankDivision: null,
          role: "JUNGLE",
          isCaptain: true,
        },
      ],
    });
    expect(view.players[0]).toMatchObject({ role: "JUNGLE", isCaptain: true });
    expect(view.avgRankLabel).toBe("Gold II");
  });
});
