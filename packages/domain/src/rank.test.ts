import { describe, expect, test } from "bun:test";
import {
  averageSoloRankMeta,
  formatRank,
  numericToRank,
  rankToNumeric,
} from "./rank";

describe("rankToNumeric", () => {
  test("orders tiers and divisions, worst division first", () => {
    expect(rankToNumeric("IRON", "IV")).toBe(0);
    expect(rankToNumeric("IRON", "I")).toBe(3);
    expect(rankToNumeric("BRONZE", "IV")).toBe(4);
  });

  test("ignores the division for apex tiers", () => {
    expect(rankToNumeric("MASTER", "IV")).toBe(rankToNumeric("MASTER", "I"));
    expect(rankToNumeric("CHALLENGER", null)).toBe(
      rankToNumeric("CHALLENGER", "I"),
    );
  });

  test("is null for an unknown or missing tier", () => {
    expect(rankToNumeric(null, "I")).toBeNull();
    expect(rankToNumeric("WOOD", "I")).toBeNull();
  });
});

describe("numericToRank", () => {
  test("round-trips an exact rank", () => {
    for (const [tier, division] of [
      ["IRON", "IV"],
      ["BRONZE", "I"],
      ["GOLD", "III"],
      ["EMERALD", "II"],
    ] as const) {
      const n = rankToNumeric(tier, division);
      expect(n).not.toBeNull();
      expect(numericToRank(n as number)).toEqual({ tier, division });
    }
  });

  test("keeps the division inside the tier it reports", () => {
    // 7.9 sits just below SILVER IV (8). It must not report the *worst*
    // division of the tier below, which is what a floored tier plus a
    // wrapped division produced.
    const justBelowSilver = numericToRank(7.9);
    expect(justBelowSilver).toEqual({ tier: "SILVER", division: "IV" });

    const justAboveBronzeOne = numericToRank(7.2);
    expect(justAboveBronzeOne).toEqual({ tier: "BRONZE", division: "I" });
  });

  test("clamps above the top tier", () => {
    expect(numericToRank(999).tier).toBe("CHALLENGER");
  });
});

describe("averageSoloRankMeta", () => {
  test("is a dash when nobody has a rank", () => {
    expect(averageSoloRankMeta([{ tier: null, division: null }])).toEqual({
      label: "—",
      tier: null,
    });
  });

  test("averages and drops the division for apex", () => {
    const meta = averageSoloRankMeta([
      { tier: "MASTER", division: null },
      { tier: "MASTER", division: null },
    ]);
    expect(meta).toEqual({ label: "master", tier: "MASTER" });
  });

  test("ignores unranked players rather than counting them as iron", () => {
    const withUnranked = averageSoloRankMeta([
      { tier: "GOLD", division: "II" },
      { tier: null, division: null },
    ]);
    const alone = averageSoloRankMeta([{ tier: "GOLD", division: "II" }]);
    expect(withUnranked).toEqual(alone);
  });
});

describe("formatRank", () => {
  test("joins tier and division", () => {
    expect(formatRank("GOLD", "II")).toBe("GOLD II");
  });

  test("drops the division for apex tiers", () => {
    expect(formatRank("MASTER", "I")).toBe("MASTER");
    expect(formatRank("challenger", "I")).toBe("challenger");
  });

  test("is null without a tier", () => {
    expect(formatRank(null, "I")).toBeNull();
    expect(formatRank("  ", "I")).toBeNull();
  });
});
