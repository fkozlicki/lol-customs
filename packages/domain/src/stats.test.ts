import { describe, expect, test } from "bun:test";
import {
  formatDuration,
  formatKda,
  formatKdaRatio,
  formatWinrate,
} from "./stats";

describe("formatKdaRatio", () => {
  test("is Perfect only when there is something to show for the zero deaths", () => {
    expect(formatKdaRatio(7, 0, 3)).toBe("Perfect");
    // A player who did nothing at all did not have a perfect game.
    expect(formatKdaRatio(0, 0, 0)).toBe("0.00:1");
  });

  test("divides kills and assists by deaths", () => {
    expect(formatKdaRatio(3, 2, 5)).toBe("4.00:1");
    expect(formatKdaRatio(1, 3, 2)).toBe("1.00:1");
  });

  test("is a dash when the row carries nothing", () => {
    expect(formatKdaRatio(null, null, null)).toBe("—");
  });
});

describe("formatKda", () => {
  test("drops a trailing zero decimal", () => {
    expect(formatKda(5, 3, 7)).toBe("5 / 3 / 7");
    expect(formatKda(5.04, 3.5, 7.96)).toBe("5 / 3.5 / 8");
  });

  test("is a dash when the row carries nothing", () => {
    expect(formatKda(null, null, null)).toBe("—");
  });
});

describe("formatWinrate", () => {
  test("rounds to whole percent", () => {
    expect(formatWinrate(1, 1)).toBe("50%");
    expect(formatWinrate(2, 1)).toBe("67%");
  });

  test("distinguishes no matches from no data", () => {
    expect(formatWinrate(0, 0)).toBe("0%");
    expect(formatWinrate(null, 3)).toBe("—");
  });
});

describe("formatDuration", () => {
  test("is minutes and padded seconds", () => {
    expect(formatDuration(0)).toBe("0:00");
    expect(formatDuration(65)).toBe("1:05");
    expect(formatDuration(2151)).toBe("35:51");
  });
});
