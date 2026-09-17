/** Hall of Fame layout. Ids match `hall_of_fame` titles; names and stat labels come from locales. */
export type HofTitleId =
  | "mvp"
  | "never_mvp"
  | "ace"
  | "never_ace"
  | "op_score"
  | "worst_op_score"
  | "best_win_rate"
  | "worst_win_rate"
  | "best_streak"
  | "tilted"
  | "most_kills"
  | "pacifist"
  | "most_assists"
  | "lone_wolf"
  | "damage_dealer"
  | "peashooter"
  | "tank"
  | "cannon_fodder"
  | "cc_king"
  | "feeder"
  | "penta_hunter"
  | "quadra_killer"
  | "best_farm"
  | "jungle_clearer"
  | "gold_hoarder"
  | "broke"
  | "level_lead"
  | "behind"
  | "vision_master"
  | "blind"
  | "life_saver"
  | "no_heals"
  | "tower_crusher"
  | "tower_hugger";

/** What a title's value measures; shown under the number. */
export type HofStatId =
  | "mvpMatches"
  | "matchesWithoutMvp"
  | "aceMatches"
  | "matchesWithoutAce"
  | "opScore"
  | "winRate"
  | "winStreak"
  | "loseStreak"
  | "kills"
  | "assists"
  | "damage"
  | "damageTaken"
  | "deaths"
  | "ccTime"
  | "kda"
  | "pentakills"
  | "quadrakills"
  | "cs"
  | "jungleCs"
  | "gold"
  | "level"
  | "vision"
  | "healing"
  | "turrets";

export type HofKind = "best" | "worst";

export interface HofTitle {
  id: HofTitleId;
  stat: HofStatId;
  kind: HofKind;
  decimals: 0 | 1 | 2;
  percent?: boolean;
}

/** The best and worst title on the same stat. */
export interface HofPair {
  best: HofTitle;
  worst: HofTitle;
}

export type HofSectionId = "headline" | "form" | "fighting" | "farm" | "map";

function best(
  id: HofTitleId,
  stat: HofStatId,
  decimals: 0 | 1 | 2,
  percent = false,
): HofTitle {
  return { id, stat, kind: "best", decimals, percent };
}

function worst(
  id: HofTitleId,
  stat: HofStatId,
  decimals: 0 | 1 | 2,
  percent = false,
): HofTitle {
  return { id, stat, kind: "worst", decimals, percent };
}

export interface HofSection {
  id: HofSectionId;
  pairs: HofPair[];
}

export const HOF_SECTIONS: HofSection[] = [
  {
    id: "headline",
    pairs: [
      {
        best: best("mvp", "mvpMatches", 0),
        worst: worst("never_mvp", "matchesWithoutMvp", 0),
      },
      {
        best: best("ace", "aceMatches", 0),
        worst: worst("never_ace", "matchesWithoutAce", 0),
      },
      {
        best: best("op_score", "opScore", 2),
        worst: worst("worst_op_score", "opScore", 2),
      },
    ],
  },
  {
    id: "form",
    pairs: [
      {
        best: best("best_win_rate", "winRate", 0, true),
        worst: worst("worst_win_rate", "winRate", 0, true),
      },
      {
        best: best("best_streak", "winStreak", 0),
        worst: worst("tilted", "loseStreak", 0),
      },
    ],
  },
  {
    id: "fighting",
    pairs: [
      {
        best: best("most_kills", "kills", 1),
        worst: worst("pacifist", "kills", 1),
      },
      {
        best: best("most_assists", "assists", 1),
        worst: worst("lone_wolf", "assists", 1),
      },
      {
        best: best("damage_dealer", "damage", 0),
        worst: worst("peashooter", "damage", 0),
      },
    ],
  },
  {
    id: "farm",
    pairs: [
      {
        best: best("gold_hoarder", "gold", 0),
        worst: worst("broke", "gold", 0),
      },
      {
        best: best("level_lead", "level", 1),
        worst: worst("behind", "level", 1),
      },
    ],
  },
  {
    id: "map",
    pairs: [
      {
        best: best("vision_master", "vision", 1),
        worst: worst("blind", "vision", 1),
      },
      {
        best: best("life_saver", "healing", 0),
        worst: worst("no_heals", "healing", 0),
      },
      {
        best: best("tower_crusher", "turrets", 2),
        worst: worst("tower_hugger", "turrets", 2),
      },
    ],
  },
];

/** Titles without a counterpart on the same stat. */
export const HOF_OTHER_RECORDS: HofTitle[] = [
  best("tank", "damageTaken", 0),
  worst("cannon_fodder", "deaths", 1),
  best("cc_king", "ccTime", 0),
  worst("feeder", "kda", 2),
  best("penta_hunter", "pentakills", 0),
  best("quadra_killer", "quadrakills", 0),
  best("best_farm", "cs", 1),
  best("jungle_clearer", "jungleCs", 1),
];

export const HOF_TITLES: HofTitle[] = [
  ...HOF_SECTIONS.flatMap((section) =>
    section.pairs.flatMap((pair) => [pair.best, pair.worst]),
  ),
  ...HOF_OTHER_RECORDS,
];

export function formatHofValue(
  entry: HofTitle,
  value: number,
  locale: string,
): string {
  const text = (entry.percent ? value * 100 : value).toLocaleString(
    locale === "pl" ? "pl-PL" : "en-US",
    {
      minimumFractionDigits: entry.decimals,
      maximumFractionDigits: entry.decimals,
    },
  );
  return entry.percent ? `${text}%` : text;
}
