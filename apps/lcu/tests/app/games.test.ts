import { describe, expect, test } from "bun:test";
import {
  creepScore,
  formatDuration,
  formatGameDate,
  itemIds,
  truncatePath,
} from "@/app/games";

const stats = {
  champLevel: 16,
  kills: 7,
  deaths: 2,
  assists: 9,
  goldEarned: 12_345,
  win: true,
  item0: 3078,
  item2: 3071,
  item6: 3364,
};

describe("a game card", () => {
  test("shows the seven item slots in order, empty ones included", () => {
    expect(itemIds(stats)).toEqual([
      3078,
      undefined,
      3071,
      undefined,
      undefined,
      undefined,
      3364,
    ]);
  });

  test("counts minions and jungle monsters together as CS", () => {
    expect(
      creepScore({ totalMinionsKilled: 180, neutralMinionsKilled: 24 }),
    ).toBe(204);
    expect(creepScore({})).toBe(0);
  });

  test("shows the duration as minutes and seconds", () => {
    expect(formatDuration(1_851)).toBe("30:51");
    expect(formatDuration(605)).toBe("10:05");
    expect(formatDuration(undefined)).toBe("—");
  });

  test("shows a dash for a game without a date", () => {
    expect(formatGameDate(undefined)).toBe("—");
  });
});

test("a long folder path keeps its end, where the folder's name is", () => {
  const path = "C:\\Riot Games\\League of Legends\\Game\\Config\\Deeper\\Still";
  expect(truncatePath(path, 20)).toBe(`…${path.slice(-19)}`);
  expect(truncatePath("C:\\Riot Games", 20)).toBe("C:\\Riot Games");
});
