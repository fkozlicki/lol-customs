import { describe, expect, test } from "bun:test";
import {
  ladderCandidates,
  toPickablePlayerView,
  withLadderRank,
} from "./picker-view";

type Ladder = Parameters<typeof ladderCandidates>[0];

const ladder = [
  {
    puuid: "1",
    game_name: "Kestrel",
    tag_line: "EUNE",
    rank_tier: "gold",
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
    rank_tier: "master",
    rank_division: "I",
  },
] as unknown as Ladder;

describe("ladder candidates", () => {
  const names = (
    picked: Parameters<typeof ladderCandidates>[1]["picked"],
    search = "",
  ) => ladderCandidates(ladder, { picked, search }).map((p) => p.gameName);

  test("leave out players without a Riot ID", () => {
    expect(names([])).toEqual(["Kestrel", "Old Tom", "Kestrel II"]);
  });

  test("leave out the picked, by Riot ID in any case", () => {
    expect(
      names([
        {
          gameName: "kestrel",
          tagLine: "eune",
          rankTier: null,
          rankDivision: null,
        },
      ]),
    ).toEqual(["Old Tom", "Kestrel II"]);
  });

  test("match the search anywhere in the name, ignoring case and spaces around it", () => {
    expect(names([], "  KES ")).toEqual(["Kestrel", "Kestrel II"]);
  });
});

describe("a player typed in by Riot ID", () => {
  test("keeps the rank the ladder has for them", () => {
    expect(
      withLadderRank({ gameName: "KESTREL", tagLine: "eune" }, ladder),
    ).toEqual({
      gameName: "KESTREL",
      tagLine: "eune",
      rankTier: "gold",
      rankDivision: "IV",
    });
  });

  test("joins unranked when the ladder does not know them", () => {
    expect(
      withLadderRank({ gameName: "Wren", tagLine: "PL1" }, ladder),
    ).toMatchObject({
      rankTier: null,
      rankDivision: null,
    });
  });
});

test("a picked player is labelled with their rank, or left for the row to call unranked", () => {
  expect(
    toPickablePlayerView({
      gameName: "Kestrel",
      tagLine: "EUNE",
      rankTier: "gold",
      rankDivision: "IV",
    }),
  ).toEqual({
    key: "kestrel#eune",
    name: "Kestrel",
    rankTier: "gold",
    rankLabel: "gold IV",
  });
});
