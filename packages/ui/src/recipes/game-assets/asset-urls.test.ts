import { describe, expect, test } from "bun:test";
import {
  championLoadingArtUrl,
  objectiveIconUrl,
  positionRoleIconUrl,
  profileIconUrl,
  rankCrestUrl,
} from "./asset-urls";

describe("champion loading art", () => {
  test("comes from Data Dragon by champion id, with no patch in the path", () => {
    expect(championLoadingArtUrl("MonkeyKing")).toBe(
      "https://ddragon.leagueoflegends.com/cdn/img/champion/loading/MonkeyKing_0.jpg",
    );
  });
});

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
  test("are served from the app's public/, by tier, in any case", () => {
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
