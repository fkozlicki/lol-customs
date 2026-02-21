/** Hall of Fame: id matches tRPC hofLeader titleId. Title/description come from locales. */
export type HofTitleId =
  | "most_kills"
  | "most_assists"
  | "best_farm"
  | "cannon_fodder"
  | "mvp"
  | "penta_hunter"
  | "vision_master"
  | "damage_dealer"
  | "gold_hoarder"
  | "ace"
  | "quadra_killer"
  | "triple_threat"
  | "tank"
  | "life_saver"
  | "cc_king"
  | "tower_crusher"
  | "jungle_clearer"
  | "op_score"
  | "big_spender"
  | "level_lead"
  | "tilted"
  | "feeder"
  | "pacifist"
  | "lone_wolf"
  | "blind"
  | "tower_hugger"
  | "behind"
  | "broke"
  | "no_heals"
  | "bottom_of_ladder"
  | "cold"
  | "veteran_of_defeat"
  | "worst_win_rate"
  | "never_mvp"
  | "never_ace"
  | "peashooter"
  | "hoarder";

export const HOF_TITLES: Array<{
  id: HofTitleId;
  valueFormat?: "decimal" | "integer" | "percent" | "none";
}> = [
  { id: "most_kills", valueFormat: "decimal" },
  { id: "most_assists", valueFormat: "decimal" },
  { id: "best_farm", valueFormat: "decimal" },
  { id: "cannon_fodder", valueFormat: "decimal" },
  { id: "mvp", valueFormat: "integer" },
  { id: "penta_hunter", valueFormat: "integer" },
  { id: "vision_master", valueFormat: "decimal" },
  { id: "damage_dealer", valueFormat: "integer" },
  { id: "gold_hoarder", valueFormat: "integer" },
  { id: "ace", valueFormat: "integer" },
  { id: "quadra_killer", valueFormat: "integer" },
  { id: "triple_threat", valueFormat: "integer" },
  { id: "tank", valueFormat: "integer" },
  { id: "life_saver", valueFormat: "integer" },
  { id: "cc_king", valueFormat: "decimal" },
  { id: "tower_crusher", valueFormat: "decimal" },
  { id: "jungle_clearer", valueFormat: "decimal" },
  { id: "op_score", valueFormat: "decimal" },
  { id: "big_spender", valueFormat: "integer" },
  { id: "level_lead", valueFormat: "decimal" },
  { id: "tilted", valueFormat: "integer" },
  { id: "feeder", valueFormat: "decimal" },
  { id: "pacifist", valueFormat: "decimal" },
  { id: "lone_wolf", valueFormat: "decimal" },
  { id: "blind", valueFormat: "decimal" },
  { id: "tower_hugger", valueFormat: "decimal" },
  { id: "behind", valueFormat: "decimal" },
  { id: "broke", valueFormat: "integer" },
  { id: "no_heals", valueFormat: "integer" },
  { id: "bottom_of_ladder", valueFormat: "integer" },
  { id: "cold", valueFormat: "integer" },
  { id: "veteran_of_defeat", valueFormat: "integer" },
  { id: "worst_win_rate", valueFormat: "percent" },
  { id: "never_mvp", valueFormat: "none" },
  { id: "never_ace", valueFormat: "none" },
  { id: "peashooter", valueFormat: "integer" },
  { id: "hoarder", valueFormat: "integer" },
];
