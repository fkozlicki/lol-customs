import { describe, expect, test } from "bun:test";
import { replayPoint } from "@/components/home/standings-after-matches";

describe("a replay point", () => {
  test("is a whole number of matches the standings can be replayed after", () => {
    expect(replayPoint("1", 10)).toBe(1);
    expect(replayPoint("9", 10)).toBe(9);
  });

  test("is live past the last replayable match, which the live standings already show", () => {
    expect(replayPoint("10", 10)).toBeUndefined();
    expect(replayPoint("999", 10)).toBeUndefined();
  });

  test("is live for anything that is not a positive whole number", () => {
    for (const after of [undefined, "", "0", "-3", "2.5", "abc", " 3", "0x3"]) {
      expect(replayPoint(after, 10)).toBeUndefined();
    }
  });

  test("allows the only match of a track with one, and nothing of a track with none", () => {
    expect(replayPoint("1", 1)).toBe(1);
    expect(replayPoint("1", 0)).toBeUndefined();
  });
});
