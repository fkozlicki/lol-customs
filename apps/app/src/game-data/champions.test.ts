import { describe, expect, test } from "bun:test";
import { CHAMPIONS, GENERATED_PATCH } from "./champions";

/**
 * champions.ts is generated, so these pin what the components rely on rather than its contents:
 * keyed by the numeric id match data carries, with an image file that is not always the name.
 */
describe("generated champion data", () => {
  test("is keyed by the numeric id match data uses", () => {
    expect(CHAMPIONS[266]?.name).toBe("Aatrox");
    expect(CHAMPIONS[1]?.name).toBe("Annie");
  });

  test("keeps the image file apart from the display name", () => {
    expect(CHAMPIONS[62]).toEqual({ name: "Wukong", image: "MonkeyKing.png" });
    expect(CHAMPIONS[145]).toEqual({ name: "Kai'Sa", image: "Kaisa.png" });
  });

  test("names a real patch to fall back on", () => {
    expect(GENERATED_PATCH).toMatch(/^\d+\.\d+\.\d+$/);
  });

  test("covers the roster", () => {
    expect(Object.keys(CHAMPIONS).length).toBeGreaterThanOrEqual(150);
  });
});
