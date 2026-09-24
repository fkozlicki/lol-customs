import { describe, expect, test } from "bun:test";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  LOCAL_ASSETS,
  objectiveIconUrl,
  positionRoleIconUrl,
  profileIconUrl,
  rankCrestUrl,
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
 * The files are fetched by scripts/generate-game-data.ts. This is what keeps the two honest: any
 * path the module can hand a component has to exist, so an icon cannot be added in code and
 * forgotten in the download.
 */
describe("self-hosted files", () => {
  test("every path the module can produce exists in public/", () => {
    const missing = LOCAL_ASSETS.map((asset) => asset.path).filter(
      (path) => !existsSync(join(PUBLIC_DIR, path)),
    );
    expect(missing).toEqual([]);
  });

  test("the list covers every crest, role and objective the module uses", () => {
    const paths = new Set(LOCAL_ASSETS.map((asset) => asset.path));
    for (const url of [
      rankCrestUrl(null),
      rankCrestUrl("challenger"),
      positionRoleIconUrl("FILL"),
      positionRoleIconUrl("JUNGLE"),
      objectiveIconUrl("herald", "red"),
      objectiveIconUrl("inhibitor", "blue"),
    ]) {
      expect(paths.has(url)).toBe(true);
    }
  });
});
