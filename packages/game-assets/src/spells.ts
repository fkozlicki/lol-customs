/**
 * Summoner spells by the numeric id match data carries, named as Data Dragon names their files. A fixed
 * set that changes with game modes, not with patches, so it is written by hand.
 */
const SUMMONER_SPELLS: Record<number, string> = {
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

/** Data Dragon's name for a spell; an unknown id shows Flash rather than a broken image. */
export function summonerSpellKey(id: number): string {
  return SUMMONER_SPELLS[id] ?? "SummonerFlash";
}
