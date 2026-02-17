/**
 * URLs for League assets (Community Dragon / Data Dragon).
 * Used for match history cards: champion, spells, items.
 */

const CDRAGON =
  "https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1";
const DDRAGON = "https://ddragon.leagueoflegends.com/cdn/14.6.1/img";

export function championIconUrl(championId: number): string {
  return `${CDRAGON}/champion-icons/${championId}.png`;
}

/** Data Dragon spell key by id (4=Flash, 14=Ignite, etc.). */
const SPELL_ID_TO_KEY: Record<number, string> = {
  1: "SummonerBoost",
  3: "SummonerExhaust",
  4: "SummonerFlash",
  6: "SummonerHaste",
  7: "SummonerHeal",
  11: "SummonerSmite",
  12: "SummonerTeleport",
  14: "SummonerDot",
  21: "SummonerBarrier",
  30: "SummonerPoroRecall",
  31: "SummonerPoroThrow",
  32: "SummonerSnowball",
  39: "SummonerSnowURFSnowball_Mark",
  54: "Summoner_UltBookPlaceholder",
  55: "Summoner_UltBookSmitePlaceholder",
};

export function spellIconUrl(spellId: number): string {
  const key = SPELL_ID_TO_KEY[spellId] ?? `SummonerFlash`;
  return `${DDRAGON}/spell/${key}.png`;
}

/** Item icon by id. */
export function itemIconUrl(itemId: number): string {
  if (itemId === 0) return "";
  return `${DDRAGON}/item/${itemId}.png`;
}

/** Primary rune style icon (precision, domination, etc.) for display. */
const PERK_STYLE_SLUG: Record<number, string> = {
  8000: "precision",
  8100: "domination",
  8200: "sorcery",
  8300: "inspiration",
  8400: "resolve",
};

export function perkStyleIconUrl(perkPrimaryStyle: number): string {
  const slug = PERK_STYLE_SLUG[perkPrimaryStyle] ?? "precision";
  return `${CDRAGON}/perk-images/styles/${slug}/${slug}_icon.svg`;
}
