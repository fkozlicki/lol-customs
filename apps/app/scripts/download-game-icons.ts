/**
 * Downloads the self-hosted game icons — rank crests, role icons, objective icons — into public/game/,
 * which is where Next serves them from (ADR 0002).
 *
 * Which files is `SELF_HOSTED_PATHS`, the list @v1/game-assets' URL functions produce, so code and disk
 * cannot drift; a test checks each one is here. Where each comes from on Community Dragon is this
 * script's business alone. They are pinned to the version matching the patch the champion list was
 * generated from rather than `latest`, which is a moving alias. Run through `bun generate:game-data`
 * at the root, after the champion list.
 *
 * Everything is downloaded and checked before anything is written. A re-run can change icon bytes
 * without changing a pixel: Community Dragon sits behind Cloudflare, which sometimes serves a
 * losslessly recompressed PNG (`cf-polished`), depending on its edge cache.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { GENERATED_PATCH } from "@v1/game-assets/champions";
import { SELF_HOSTED_PATHS } from "@v1/game-assets/urls";

const CDRAGON = "https://raw.communitydragon.org";
const PUBLIC_DIR = join(
  fileURLToPath(new URL(".", import.meta.url)),
  "..",
  "public",
);

/** Community Dragon's folder for each kind of self-hosted icon, and its file naming. */
function cdragonSource(path: string): string {
  const file = path.split("/").pop();
  if (path.startsWith("/game/ranks/")) {
    return `plugins/rcp-fe-lol-static-assets/global/default/images/ranked-mini-crests/${file}`;
  }
  if (path.startsWith("/game/roles/")) {
    return `plugins/rcp-fe-lol-clash/global/default/assets/images/position-selector/positions/icon-position-${file}`;
  }
  if (path.startsWith("/game/objectives/")) {
    return `plugins/rcp-fe-lol-match-history/global/default/${file}`;
  }
  throw new Error(`No Community Dragon source for ${path}`);
}

// Community Dragon names its versions major.minor, so 16.19.1 is 16.19.
const assetVersion = GENERATED_PATCH.split(".").slice(0, 2).join(".");

const icons = await Promise.all(
  SELF_HOSTED_PATHS.map(async (path) => {
    const url = `${CDRAGON}/${assetVersion}/${cdragonSource(path)}`;
    const response = await fetch(url);
    const type = response.headers.get("content-type") ?? "";
    if (!response.ok || !type.startsWith("image/")) {
      throw new Error(`${response.status} ${type} ${url}`);
    }
    return { path, bytes: Buffer.from(await response.arrayBuffer()) };
  }),
);

for (const icon of icons) {
  const file = join(PUBLIC_DIR, icon.path);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, icon.bytes);
}

console.log(
  `Wrote ${icons.length} icons from Community Dragon ${assetVersion}`,
);
