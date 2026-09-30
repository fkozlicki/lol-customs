import { describe, expect, test } from "bun:test";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { TEAM_ROLES } from "@v1/domain/shuffle";
import {
  positionRoleIconUrl,
  rankCrestUrl,
  SELF_HOSTED_PATHS,
} from "@v1/game-assets/urls";

/** The URL builders live in @v1/game-assets; the files they point at are this app's to serve. */
const PUBLIC_DIR = join(
  fileURLToPath(new URL(".", import.meta.url)),
  "..",
  "..",
  "public",
);

/**
 * The files are fetched by scripts/download-game-icons.ts from this same list. This is what keeps
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

describe("role icons", () => {
  test("exist for every role a draw assigns", () => {
    for (const role of TEAM_ROLES) {
      expect(positionRoleIconUrl(role)).not.toBe(positionRoleIconUrl("FILL"));
    }
  });
});
