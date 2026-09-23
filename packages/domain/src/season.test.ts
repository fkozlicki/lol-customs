import { describe, expect, test } from "bun:test";
import { ALL_TIME_SEASON, resolveSeason, seasonToParam } from "./season";

const seasons = [
  { id: 1, isCurrent: false },
  { id: 2, isCurrent: true },
];

describe("resolveSeason", () => {
  test("takes an explicit season that exists", () => {
    expect(resolveSeason("1", seasons)).toBe(1);
  });

  test("understands both spellings of the all-time track", () => {
    expect(resolveSeason("all", seasons)).toBe(ALL_TIME_SEASON);
    // ALL_TIME_SEASON is 0, so "0" must mean the same thing rather than
    // falling through to the current season.
    expect(resolveSeason("0", seasons)).toBe(ALL_TIME_SEASON);
  });

  test("falls back to the current season", () => {
    expect(resolveSeason(null, seasons)).toBe(2);
    expect(resolveSeason("", seasons)).toBe(2);
    expect(resolveSeason("nonsense", seasons)).toBe(2);
    expect(resolveSeason("99", seasons)).toBe(2);
    expect(resolveSeason("1.5", seasons)).toBe(2);
  });

  test("falls back to the last season when none is marked current", () => {
    expect(resolveSeason(null, [{ id: 1 }, { id: 7 }])).toBe(7);
  });

  test("is the all-time track when there are no seasons at all", () => {
    expect(resolveSeason("3", [])).toBe(ALL_TIME_SEASON);
  });
});

describe("seasonToParam", () => {
  test("round-trips through resolveSeason", () => {
    for (const season of [1, 2, ALL_TIME_SEASON]) {
      expect(resolveSeason(seasonToParam(season), seasons)).toBe(season);
    }
  });
});
