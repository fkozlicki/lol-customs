/**
 * URLs for League assets (Community Dragon / Data Dragon).
 * Pass latest Data Dragon version (from versions.json) so new items/spells load.
 */

const CDRAGON =
  "https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1";

const DEFAULT_DD_VERSION = "14.6.1";

function dataDragonBase(version: string): string {
  return `https://ddragon.leagueoflegends.com/cdn/${version}/img`;
}

export function championIconUrl(championId: number): string {
  return `${CDRAGON}/champion-icons/${championId}.png`;
}

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

export function spellIconUrl(spellId: number, ddVersion = DEFAULT_DD_VERSION): string {
  const key = SPELL_ID_TO_KEY[spellId] ?? "SummonerFlash";
  return `${dataDragonBase(ddVersion)}/spell/${key}.png`;
}

export function itemIconUrl(itemId: number, ddVersion = DEFAULT_DD_VERSION): string {
  if (itemId === 0) return "";
  return `${dataDragonBase(ddVersion)}/item/${itemId}.png`;
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
