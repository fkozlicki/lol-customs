/**
 * Every game asset URL, in one place, for the app, the design system and Derby Sync alike.
 *
 * Two kinds. Champion, item, spell and profile-icon art comes from Data Dragon, Riot's authorised
 * source, addressed by patch so a URL never changes what it points at (ADR 0002). Rank crests, role
 * icons and objective icons are a small fixed set, self-hosted under the app's `public/game/` by
 * `apps/app/scripts/download-game-icons.ts`; Storybook serves the same folder at the same path.
 *
 * Keeping every URL behind these functions means moving any of them to another origin later is a
 * change to this file alone.
 */
import { summonerSpellKey } from "./spells";

const DD_BASE = "https://ddragon.leagueoflegends.com";

export function championImageUrl(patch: string, imageFile: string): string {
  return `${DD_BASE}/cdn/${patch}/img/champion/${imageFile}`;
}

/**
 * A champion's loading-screen art, base skin, by Data Dragon id (`champion(id).dataDragonId`:
 * `MonkeyKing` for Wukong). Data Dragon serves it without a patch; it changes only with a visual
 * update. Read into a canvas by the backdrop, so it is fetched as is, not through `next/image`.
 */
export function championLoadingArtUrl(dataDragonId: string): string {
  return `${DD_BASE}/cdn/img/champion/loading/${dataDragonId}_0.jpg`;
}

/** An item by the numeric id match data carries. */
export function itemImageUrl(patch: string, itemId: number): string {
  return `${DD_BASE}/cdn/${patch}/img/item/${itemId}.png`;
}

/** A summoner spell by the numeric id match data carries. */
export function spellImageUrl(patch: string, spellId: number): string {
  return `${DD_BASE}/cdn/${patch}/img/spell/${summonerSpellKey(spellId)}.png`;
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

/**
 * Each role a drawn team fills, named the way Riot's position-selector icons are. The keys are the
 * roles `@v1/domain` draws; the app's test checks the two lists agree, since this package cannot
 * import the domain (ADR 0004).
 */
const ROLE_FILES = {
  TOP: "top",
  JUNGLE: "jungle",
  MID: "middle",
  ADC: "bottom",
  SUPPORT: "utility",
} as const;

type Role = keyof typeof ROLE_FILES;

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
  const file = ROLE_FILES[role as Role] ?? "none";
  return `/game/roles/${file}.png`;
}

export function objectiveIconUrl(objective: Objective, side: Side): string {
  return `/game/objectives/${objective}-${SIDE_ID[side]}.png`;
}

/**
 * Every path under the app's `public/` the functions above can return, produced by calling them — so the
 * list cannot drift from what components actually ask for. The generator downloads exactly these,
 * and the app's test checks each one is on disk.
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
