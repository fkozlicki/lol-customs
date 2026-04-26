const DD_BASE = "https://ddragon.leagueoflegends.com";

const CDRAGON_PROFILE_ICONS =
  "https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/profile-icons";

const CDRAGON_RANK_CRESTS =
  "https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-static-assets/global/default/images/ranked-mini-crests/";

const CDRAGON_RANK_EMBLEMS =
  "https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-static-assets/global/default/ranked-emblem/";

const CDRAGON_POSITION_ICONS =
  "https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-clash/global/default/assets/images/position-selector/positions/";

const POSITION_ROLE_FILES: Record<string, string> = {
  TOP: "icon-position-top.png",
  JUNGLE: "icon-position-jungle.png",
  MID: "icon-position-middle.png",
  ADC: "icon-position-bottom.png",
  SUPPORT: "icon-position-utility.png",
};

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

export function championImageUrl(patch: string, imageFull: string): string {
  return `${DD_BASE}/cdn/${patch}/img/champion/${imageFull}`;
}

export function itemImageUrl(patch: string, imageFull: string): string {
  return `${DD_BASE}/cdn/${patch}/img/item/${imageFull}`;
}

export function spellImageUrl(patch: string, imageFull: string): string {
  return `${DD_BASE}/cdn/${patch}/img/spell/${imageFull}`;
}

export function profileIconUrl(iconId: number | null): string | null {
  if (iconId == null) return null;
  return `${CDRAGON_PROFILE_ICONS}/${iconId}.jpg`;
}

export function rankCrestUrl(tier: string | null): string {
  if (!tier?.trim()) return `${CDRAGON_RANK_CRESTS}unranked.svg`;
  const normalized = tier.toLowerCase();
  return RANK_TIERS.has(normalized)
    ? `${CDRAGON_RANK_CRESTS}${normalized}.svg`
    : `${CDRAGON_RANK_CRESTS}unranked.svg`;
}

export function rankEmblemUrl(tier: string | null): string {
  if (!tier?.trim()) return `${CDRAGON_RANK_EMBLEMS}emblem-unranked.png`;
  const normalized = tier.toLowerCase();
  return RANK_TIERS.has(normalized)
    ? `${CDRAGON_RANK_EMBLEMS}emblem-${normalized}.png`
    : `${CDRAGON_RANK_EMBLEMS}emblem-unranked.png`;
}

/** Clash position-selector icons (top / jungle / middle / bottom / utility). */
export function positionRoleIconUrl(role: string): string {
  const file = POSITION_ROLE_FILES[role] ?? "icon-position-none.png";
  return `${CDRAGON_POSITION_ICONS}${file}`;
}
