import { describe, expect, test } from "bun:test";
import { withStandingsPositions } from "./standings";

const row = (rating: number | null, qualified = true) => ({
  rating,
  qualified,
});

describe("withStandingsPositions", () => {
  test("counts from one, down the order given", () => {
    const positions = withStandingsPositions([
      row(1059),
      row(1050),
      row(1023),
    ]).map((r) => r.position);
    expect(positions).toEqual([1, 2, 3]);
  });

  test("players on the same rating share a position, and the next one skips", () => {
    // The SQL rule is 1 + the number of players rated above you, so a tie for
    // second leaves nobody in third.
    const positions = withStandingsPositions([
      row(1059),
      row(1000),
      row(1000),
      row(980),
    ]).map((r) => r.position);
    expect(positions).toEqual([1, 2, 2, 4]);
  });

  test("players still qualifying hold no position", () => {
    const positions = withStandingsPositions([
      row(1059),
      row(1000),
      row(978, false),
      row(940, false),
    ]).map((r) => r.position);
    expect(positions).toEqual([1, 2, null, null]);
  });

  test("agrees with counting how many qualified players are rated higher", () => {
    const rows = [row(1059), row(1050), row(1050), row(900), row(1200, false)];
    for (const result of withStandingsPositions(rows)) {
      if (!result.qualified) continue;
      const above = rows.filter(
        (other) =>
          other.qualified && (other.rating ?? 0) > (result.rating ?? 0),
      ).length;
      expect(result.position).toBe(above + 1);
    }
  });

  test("keeps the rest of the row intact", () => {
    const [first] = withStandingsPositions([
      { rating: 1000, qualified: true, puuid: "abc" },
    ]);
    expect(first).toEqual({
      rating: 1000,
      qualified: true,
      puuid: "abc",
      position: 1,
    });
  });

  test("handles an empty board", () => {
    expect(withStandingsPositions([])).toEqual([]);
  });
});
