import { describe, expect, test } from "bun:test";
import {
  formatRiotId,
  parsePlayerSlug,
  parseRiotId,
  playerHref,
  riotIdKey,
} from "./riot-id";

describe("parseRiotId", () => {
  test("splits on the last hash, so names may contain one", () => {
    expect(parseRiotId("Sutokopter#EUNE")).toEqual({
      gameName: "Sutokopter",
      tagLine: "EUNE",
    });
    expect(parseRiotId("na#me#TAG")).toEqual({
      gameName: "na#me",
      tagLine: "TAG",
    });
  });

  test("rejects anything without both halves", () => {
    expect(parseRiotId("Sutokopter")).toBeNull();
    expect(parseRiotId("#EUNE")).toBeNull();
    expect(parseRiotId("Sutokopter#")).toBeNull();
    expect(parseRiotId("   ")).toBeNull();
  });
});

describe("riotIdKey", () => {
  test("ignores case and surrounding space, so one player is one key", () => {
    expect(riotIdKey({ gameName: " Sutokopter ", tagLine: "eune" })).toBe(
      riotIdKey({ gameName: "SUTOKOPTER", tagLine: "EUNE" }),
    );
  });
});

describe("playerHref and parsePlayerSlug", () => {
  test("round-trip a Riot ID through a profile URL", () => {
    for (const id of [
      { gameName: "Sutokopter", tagLine: "EUNE" },
      { gameName: "jaja klekoczą", tagLine: "EUNE" },
      { gameName: "Kotêji", tagLine: "EUNE" },
      { gameName: "na-me", tagLine: "TAG" },
    ]) {
      const slug = playerHref(id.gameName, id.tagLine).replace("/players/", "");
      expect(parsePlayerSlug(slug)).toEqual(id);
    }
  });

  test("is a dead link without a Riot ID", () => {
    expect(playerHref(null, "EUNE")).toBe("#");
    expect(playerHref("Sutokopter", null)).toBe("#");
  });
});

describe("formatRiotId", () => {
  test("writes it the way players do", () => {
    expect(formatRiotId({ gameName: "Sutokopter", tagLine: "EUNE" })).toBe(
      "Sutokopter#EUNE",
    );
  });
});
