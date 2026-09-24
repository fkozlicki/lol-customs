import { describe, expect, test } from "bun:test";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  objectiveIconUrl,
  positionRoleIconUrl,
  profileIconUrl,
  rankCrestUrl,
  SELF_HOSTED_PATHS,
} from "./asset-urls";

const PUBLIC_DIR = join(
  fileURLToPath(new URL(".", import.meta.url)),
  "..",
  "..",
  "public",
);

describe("profile icons", () => {
  test("come from Data Dragon, pinned to the patch", () => {
    expect(profileIconUrl("16.19.1", 1151)).toBe(
      "https://ddragon.leagueoflegends.com/cdn/16.19.1/img/profileicon/1151.png",
    );
  });

  test("are absent when the player has none on record", () => {
    expect(profileIconUrl("16.19.1", null)).toBeNull();
  });
});

describe("rank crests", () => {
  test("are served from the app, by tier, in any case", () => {
    expect(rankCrestUrl("GOLD")).toBe("/game/ranks/gold.svg");
    expect(rankCrestUrl("grandmaster")).toBe("/game/ranks/grandmaster.svg");
  });

  test("fall back to unranked for no tier or an unknown one", () => {
    expect(rankCrestUrl(null)).toBe("/game/ranks/unranked.svg");
    expect(rankCrestUrl("  ")).toBe("/game/ranks/unranked.svg");
    expect(rankCrestUrl("WOOD")).toBe("/game/ranks/unranked.svg");
  });
});

describe("role icons", () => {
  test("are served from the app, by the role the shuffle assigns", () => {
    expect(positionRoleIconUrl("TOP")).toBe("/game/roles/top.png");
    expect(positionRoleIconUrl("ADC")).toBe("/game/roles/bottom.png");
    expect(positionRoleIconUrl("SUPPORT")).toBe("/game/roles/utility.png");
  });

  test("fall back to the empty position for an unknown role", () => {
    expect(positionRoleIconUrl("FILL")).toBe("/game/roles/none.png");
  });
});

describe("objective icons", () => {
  test("are served from the app, in the side's colour", () => {
    expect(objectiveIconUrl("baron", "blue")).toBe(
      "/game/objectives/baron-100.png",
    );
    expect(objectiveIconUrl("tower", "red")).toBe(
      "/game/objectives/tower-200.png",
    );
  });
});

/**
 * The files are fetched by scripts/generate-game-data.ts from this same list. This is what keeps
 * code and disk honest: an icon cannot be added in code and forgotten in the download.
 */
describe("self-hosted files", () => {
  test("every path the module can produce exists in public/", () => {
    const missing = SELF_HOSTED_PATHS.filter(
      (path) => !existsSync(join(PUBLIC_DIR, path)),
    );
    expect(missing).toEqual([]);
  });

  test("lists each crest, role and objective once", () => {
    // 10 tiers + unranked, 5 roles + the blank one, 5 objectives on 2 sides
    expect(SELF_HOSTED_PATHS.length).toBe(11 + 6 + 10);
    expect(new Set(SELF_HOSTED_PATHS).size).toBe(SELF_HOSTED_PATHS.length);
  });

  test("includes the fallbacks, which no real tier or role produces", () => {
    expect(SELF_HOSTED_PATHS).toContain(rankCrestUrl(null));
    expect(SELF_HOSTED_PATHS).toContain(positionRoleIconUrl("FILL"));
  });
});
