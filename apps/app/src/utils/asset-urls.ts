/**
 * Every game asset URL in the app, in one place.
 *
 * Two kinds. Champion, item, spell and profile-icon art comes from Data Dragon, Riot's authorised
 * source, addressed by patch so a URL never changes what it points at; `next/image` resizes and
 * re-encodes it and serves it from our own domain. Rank crests, role icons and objective icons are
 * a small fixed set, self-hosted under `public/game/` by `scripts/generate-game-data.ts`.
 *
 * Keeping every URL behind these functions means moving any of them to another origin later is a
 * change to this file alone.
 */
import type { TeamRole } from "@v1/domain/shuffle";

const DD_BASE = "https://ddragon.leagueoflegends.com";

export function championImageUrl(patch: string, imageFile: string): string {
  return `${DD_BASE}/cdn/${patch}/img/champion/${imageFile}`;
}

/**
 * A champion's loading-screen art, base skin, by Data Dragon id (the square image's name without
 * `.png`: `MonkeyKing` for Wukong). Data Dragon serves it without a patch; it changes only with a
 * visual update. Read into a canvas by the backdrop, so it is fetched as is, not through `next/image`.
 */
export function championLoadingArtUrl(championId: string): string {
  return `${DD_BASE}/cdn/img/champion/loading/${championId}_0.jpg`;
}

export function itemImageUrl(patch: string, imageFile: string): string {
  return `${DD_BASE}/cdn/${patch}/img/item/${imageFile}`;
}

export function spellImageUrl(patch: string, imageFile: string): string {
  return `${DD_BASE}/cdn/${patch}/img/spell/${imageFile}`;
}

export function profileIconUrl(
  patch: string,
  iconId: number | null,
): string | null {
  if (iconId == null) return null;
  return `${DD_BASE}/cdn/${patch}/img/profileicon/${iconId}.png`;
}

// --- Self-hosted ---

const RANK_TIERS = new Set([
  "iron",
  "bronze",
  "silver",
  "gold",
  "platinum",
  "emerald",
  "diamond",
  "master",
  "grandmaster",
  "challenger",
]);

/** Each role a drawn team fills, named the way Riot's position-selector icons are. */
const ROLE_FILES = {
  TOP: "top",
  JUNGLE: "jungle",
  MID: "middle",
  ADC: "bottom",
  SUPPORT: "utility",
} as const satisfies Record<TeamRole, string>;

export const OBJECTIVES = [
  "baron",
  "dragon",
  "herald",
  "inhibitor",
  "tower",
] as const;
export type Objective = (typeof OBJECTIVES)[number];

/** Riot numbers the blue side 100 and the red side 200, and names its icons that way. */
const SIDE_ID = { blue: 100, red: 200 } as const;
export type Side = keyof typeof SIDE_ID;

export function rankCrestUrl(tier: string | null): string {
  const normalized = tier?.trim().toLowerCase() ?? "";
  return `/game/ranks/${RANK_TIERS.has(normalized) ? normalized : "unranked"}.svg`;
}

/** Takes a plain string because roles arrive from stored data; anything unknown is the blank icon. */
export function positionRoleIconUrl(role: string): string {
  const file = ROLE_FILES[role as TeamRole] ?? "none";
  return `/game/roles/${file}.png`;
}

export function objectiveIconUrl(objective: Objective, side: Side): string {
  return `/game/objectives/${objective}-${SIDE_ID[side]}.png`;
}

/**
 * Every path under `public/` the functions above can return, produced by calling them — so the
 * list cannot drift from what components actually ask for. The generator downloads exactly these,
 * and a test checks each one is on disk.
 */
export const SELF_HOSTED_PATHS: readonly string[] = [
  ...[...RANK_TIERS, null].map(rankCrestUrl),
  ...[...Object.keys(ROLE_FILES), "unknown"].map(positionRoleIconUrl),
  ...OBJECTIVES.flatMap((objective) =>
    (Object.keys(SIDE_ID) as Side[]).map((side) =>
      objectiveIconUrl(objective, side),
    ),
  ),
];
