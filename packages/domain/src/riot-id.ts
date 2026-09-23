/** A player's Riot ID: the name before the "#" and the tag after it. */
export interface RiotId {
  gameName: string;
  tagLine: string;
}

export function riotIdKey(riotId: RiotId): string {
  return `${riotId.gameName.trim().toLowerCase()}#${riotId.tagLine.trim().toLowerCase()}`;
}

/** Split on the last # so game names may contain the character. */
export function parseRiotId(raw: string): RiotId | null {
  const value = raw.trim();
  const separator = value.lastIndexOf("#");
  if (separator <= 0 || separator >= value.length - 1) return null;

  const gameName = value.slice(0, separator).trim();
  const tagLine = value.slice(separator + 1).trim();
  if (!gameName || !tagLine) return null;

  return { gameName, tagLine };
}

export function formatRiotId(riotId: RiotId): string {
  return `${riotId.gameName}#${riotId.tagLine}`;
}

/** Profile URL for a player, or "#" when the Riot ID is unknown. */
export function playerHref(
  gameName: string | null | undefined,
  tagLine: string | null | undefined,
): string {
  if (!gameName || !tagLine) return "#";
  return `/players/${encodeURIComponent(gameName)}-${encodeURIComponent(tagLine)}`;
}

/** Inverse of `playerHref`: the slug a profile route carries, back into a Riot ID. */
export function parsePlayerSlug(slug: string): RiotId | null {
  const decoded = decodeURIComponent(slug).trim();
  const separator = decoded.lastIndexOf("-");
  if (separator <= 0 || separator >= decoded.length - 1) return null;

  const gameName = decoded.slice(0, separator).trim();
  const tagLine = decoded.slice(separator + 1).trim();
  if (!gameName || !tagLine) return null;

  return { gameName, tagLine };
}
