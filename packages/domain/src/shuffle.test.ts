import { describe, expect, test } from "bun:test";
import { buildRandomTeams, ROSTER_SIZE, type RosterPlayer } from "./shuffle";

const roster = (count: number): RosterPlayer[] =>
  Array.from({ length: count }, (_, i) => ({
    gameName: `Player${i}`,
    tagLine: "EUNE",
    rankTier: "GOLD",
    rankDivision: "II",
  }));

const ROLES = ["TOP", "JUNGLE", "MID", "ADC", "SUPPORT"];

describe("buildRandomTeams", () => {
  test("refuses a roster that is not two full sides", () => {
    // Slicing silently produced short teams, and an eleventh player took an
    // undefined role.
    expect(() => buildRandomTeams(roster(9))).toThrow();
    expect(() => buildRandomTeams(roster(11))).toThrow();
    expect(() => buildRandomTeams([])).toThrow();
  });

  test("puts every player on exactly one side", () => {
    const { teamA, teamB } = buildRandomTeams(roster(ROSTER_SIZE));
    const names = [...teamA.players, ...teamB.players].map((p) => p.gameName);
    expect(names.length).toBe(ROSTER_SIZE);
    expect(new Set(names).size).toBe(ROSTER_SIZE);
  });

  test("gives each side all five roles, in role order", () => {
    const { teamA, teamB } = buildRandomTeams(roster(ROSTER_SIZE));
    for (const team of [teamA, teamB]) {
      expect(team.players.map((p) => p.role)).toEqual(ROLES);
    }
  });

  test("gives each side exactly one captain", () => {
    const { teamA, teamB } = buildRandomTeams(roster(ROSTER_SIZE));
    for (const team of [teamA, teamB]) {
      expect(team.players.filter((p) => p.isCaptain).length).toBe(1);
    }
  });

  test("reports the average rank of the side", () => {
    const { teamA } = buildRandomTeams(roster(ROSTER_SIZE));
    expect(teamA.avgRankLabel).toBe("gold II");
    expect(teamA.avgRankTier).toBe("GOLD");
  });

  test("actually shuffles", () => {
    const first = buildRandomTeams(roster(ROSTER_SIZE))
      .teamA.players.map((p) => p.gameName)
      .join();
    const draws = Array.from({ length: 30 }, () =>
      buildRandomTeams(roster(ROSTER_SIZE))
        .teamA.players.map((p) => p.gameName)
        .join(),
    );
    expect(draws.some((d) => d !== first)).toBe(true);
  });
});
