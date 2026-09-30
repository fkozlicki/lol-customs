import { describe, expect, test } from "bun:test";
import { allChampions, champion, GENERATED_PATCH } from "./champions";

/**
 * The champion list is generated, so these pin what its users rely on rather than its contents: keyed by
 * the numeric id match data carries, with an image file that is not always the name.
 */
describe("champions", () => {
  test("are found by the numeric id match data uses", () => {
    expect(champion(266)?.name).toBe("Aatrox");
    expect(champion(1)?.name).toBe("Annie");
  });

  test("keep the image file and Data Dragon id apart from the display name", () => {
    expect(champion(62)).toEqual({
      name: "Wukong",
      imageFile: "MonkeyKing.png",
      dataDragonId: "MonkeyKing",
    });
    expect(champion(145)?.dataDragonId).toBe("Kaisa");
  });

  test("are null for an id the list does not have, or none", () => {
    expect(champion(999_999)).toBeNull();
    expect(champion(null)).toBeNull();
  });

  test("cover the roster", () => {
    expect(allChampions().length).toBeGreaterThanOrEqual(150);
  });

  test("name a real patch to fall back on", () => {
    expect(GENERATED_PATCH).toMatch(/^\d+\.\d+\.\d+$/);
  });
});
