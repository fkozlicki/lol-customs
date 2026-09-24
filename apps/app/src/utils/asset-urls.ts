/**
 * Every game asset URL in the app, in one place.
 *
 * Two kinds. Champion, item, spell and profile-icon art comes from Data Dragon, Riot's authorised
 * source, addressed by patch so a URL never changes what it points at; `next/image` resizes and
 * re-encodes it and serves it from our own domain. Rank crests, role icons and objective icons are
 * a small fixed set, so they are self-hosted under `public/game/`, fetched once from a pinned
 * Community Dragon version by `scripts/generate-game-data.ts`.
 *
 * Keeping every URL behind these functions means moving any of them to another origin later is a
 * change to this file alone.
 */

const DD_BASE = "https://ddragon.leagueoflegends.com";

export function championImageUrl(patch: string, imageFile: string): string {
  return `${DD_BASE}/cdn/${patch}/img/champion/${imageFile}`;
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

const RANK_TIERS = [
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
] as const;

/** The shuffle's roles, mapped to the file names of Riot's position-selector icons. */
const ROLE_FILES: Record<string, string> = {
  TOP: "top",
  JUNGLE: "jungle",
  MID: "middle",
  ADC: "bottom",
  SUPPORT: "utility",
};

const OBJECTIVES = ["baron", "dragon", "herald", "inhibitor", "tower"] as const;
export type Objective = (typeof OBJECTIVES)[number];

/** Riot numbers the blue side 100 and the red side 200, and names the icons that way. */
const SIDE_ID = { blue: 100, red: 200 } as const;

export function rankCrestUrl(tier: string | null): string {
  const normalized = tier?.trim().toLowerCase() ?? "";
  const known = (RANK_TIERS as readonly string[]).includes(normalized);
  return `/game/ranks/${known ? normalized : "unranked"}.svg`;
}

export function positionRoleIconUrl(role: string): string {
  return `/game/roles/${ROLE_FILES[role] ?? "none"}.png`;
}

export function objectiveIconUrl(
  objective: Objective,
  side: "blue" | "red",
): string {
  return `/game/objectives/${objective}-${SIDE_ID[side]}.png`;
}

// --- What the generator downloads ---

const CDRAGON_RANKS =
  "plugins/rcp-fe-lol-static-assets/global/default/images/ranked-mini-crests";
const CDRAGON_ROLES =
  "plugins/rcp-fe-lol-clash/global/default/assets/images/position-selector/positions";
const CDRAGON_OBJECTIVES = "plugins/rcp-fe-lol-match-history/global/default";

/**
 * Every self-hosted file: where it lives under `public/`, and where it comes from on Community
 * Dragon, relative to a version root. The generator downloads exactly this list, and a test checks
 * that every path above is in it and on disk.
 */
export const LOCAL_ASSETS: { path: string; source: string }[] = [
  ...[...RANK_TIERS, "unranked"].map((tier) => ({
    path: `/game/ranks/${tier}.svg`,
    source: `${CDRAGON_RANKS}/${tier}.svg`,
  })),
  ...[...Object.values(ROLE_FILES), "none"].map((file) => ({
    path: `/game/roles/${file}.png`,
    source: `${CDRAGON_ROLES}/icon-position-${file}.png`,
  })),
  ...OBJECTIVES.flatMap((objective) =>
    Object.values(SIDE_ID).map((id) => ({
      path: `/game/objectives/${objective}-${id}.png`,
      source: `${CDRAGON_OBJECTIVES}/${objective}-${id}.png`,
    })),
  ),
];
