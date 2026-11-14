import { describe, expect, test } from "bun:test";
import { drawTeams, ROSTER_SIZE, type RosterPlayer } from "../src/draw";

const roster = (count: number): RosterPlayer[] =>
  Array.from({ length: count }, (_, i) => ({
    gameName: `Player${i}`,
    tagLine: "EUNE",
    rankTier: "GOLD",
    rankDivision: "II",
  }));

const ROLES = ["TOP", "JUNGLE", "MID", "ADC", "SUPPORT"];

describe("drawTeams", () => {
  test("refuses a roster that is not two full sides", () => {
    // Slicing silently produced short teams, and an eleventh player took an
    // undefined role.
    expect(() => drawTeams(roster(9))).toThrow();
    expect(() => drawTeams(roster(11))).toThrow();
    expect(() => drawTeams([])).toThrow();
  });

  test("puts every player on exactly one side", () => {
    const { teamA, teamB } = drawTeams(roster(ROSTER_SIZE));
    const names = [...teamA.players, ...teamB.players].map((p) => p.gameName);
    expect(names.length).toBe(ROSTER_SIZE);
    expect(new Set(names).size).toBe(ROSTER_SIZE);
  });

  test("gives each side all five roles, in role order", () => {
    const { teamA, teamB } = drawTeams(roster(ROSTER_SIZE));
    for (const team of [teamA, teamB]) {
      expect(team.players.map((p) => p.role)).toEqual(ROLES);
    }
  });

  test("gives each side exactly one captain", () => {
    const { teamA, teamB } = drawTeams(roster(ROSTER_SIZE));
    for (const team of [teamA, teamB]) {
      expect(team.players.filter((p) => p.isCaptain).length).toBe(1);
    }
  });

  test("reports the average rank of the side", () => {
    const { teamA } = drawTeams(roster(ROSTER_SIZE));
    expect(teamA.avgRankLabel).toBe("gold II");
    expect(teamA.avgRankTier).toBe("GOLD");
  });

  test("actually shuffles", () => {
    const first = drawTeams(roster(ROSTER_SIZE))
      .teamA.players.map((p) => p.gameName)
      .join();
    const draws = Array.from({ length: 30 }, () =>
      drawTeams(roster(ROSTER_SIZE))
        .teamA.players.map((p) => p.gameName)
        .join(),
    );
    expect(draws.some((d) => d !== first)).toBe(true);
  });
});
