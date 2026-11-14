/** Hall of Fame layout. Ids match `hall_of_fame` titles; names and stat labels come from locales. */
export type HallOfFameTitleId =
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
  | "fewest_deaths"
  | "cannon_fodder"
  | "best_kda"
  | "feeder"
  | "cc_king"
  | "no_cc"
  | "double_trouble"
  | "triple_threat"
  | "quadra_killer"
  | "penta_hunter"
  | "best_farm"
  | "worst_farm"
  | "jungle_clearer"
  | "jungle_tourist"
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
export type HallOfFameStatId =
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
  | "deaths"
  | "ccTime"
  | "kda"
  | "doublekills"
  | "triplekills"
  | "quadrakills"
  | "pentakills"
  | "cs"
  | "jungleCs"
  | "gold"
  | "level"
  | "vision"
  | "healing"
  | "turrets";

export type HallOfFameKind = "best" | "worst";

export interface HallOfFameTitle {
  id: HallOfFameTitleId;
  stat: HallOfFameStatId;
  kind: HallOfFameKind;
  decimals: 0 | 1 | 2;
  percent?: boolean;
}

/** The best and worst title on the same stat. */
export interface HallOfFamePair {
  best: HallOfFameTitle;
  worst: HallOfFameTitle;
}

export type HallOfFameSectionId =
  | "headline"
  | "form"
  | "fighting"
  | "multikills"
  | "farm"
  | "map";

function best(
  id: HallOfFameTitleId,
  stat: HallOfFameStatId,
  decimals: 0 | 1 | 2,
  percent = false,
): HallOfFameTitle {
  return { id, stat, kind: "best", decimals, percent };
}

function worst(
  id: HallOfFameTitleId,
  stat: HallOfFameStatId,
  decimals: 0 | 1 | 2,
  percent = false,
): HallOfFameTitle {
  return { id, stat, kind: "worst", decimals, percent };
}

export interface HallOfFameSection {
  id: HallOfFameSectionId;
  pairs: HallOfFamePair[];
  /** Titles without a counterpart on the same stat, shown full width after the pairs. */
  singles?: HallOfFameTitle[];
}

export const HALL_OF_FAME_SECTIONS: HallOfFameSection[] = [
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
      {
        best: best("fewest_deaths", "deaths", 1),
        worst: worst("cannon_fodder", "deaths", 1),
      },
      {
        best: best("best_kda", "kda", 2),
        worst: worst("feeder", "kda", 2),
      },
      {
        best: best("cc_king", "ccTime", 0),
        worst: worst("no_cc", "ccTime", 0),
      },
    ],
  },
  {
    id: "multikills",
    pairs: [],
    singles: [
      best("double_trouble", "doublekills", 0),
      best("triple_threat", "triplekills", 0),
      best("quadra_killer", "quadrakills", 0),
      best("penta_hunter", "pentakills", 0),
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
      {
        best: best("best_farm", "cs", 1),
        worst: worst("worst_farm", "cs", 1),
      },
      {
        best: best("jungle_clearer", "jungleCs", 1),
        worst: worst("jungle_tourist", "jungleCs", 1),
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

export const HALL_OF_FAME_TITLES: HallOfFameTitle[] =
  HALL_OF_FAME_SECTIONS.flatMap((section) => [
    ...section.pairs.flatMap((pair) => [pair.best, pair.worst]),
    ...(section.singles ?? []),
  ]);

export function formatHallOfFameValue(
  entry: HallOfFameTitle,
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
