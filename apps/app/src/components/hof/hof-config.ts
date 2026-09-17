/** Hall of Fame layout. Ids match `hall_of_fame` titles; names and descriptions come from locales. */
export type HofTitleId =
  | "mvp"
  | "never_mvp"
  | "ace"
  | "never_ace"
  | "op_score"
  | "bottom_of_ladder"
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

export type HofUnit =
  | "perMatch"
  | "total"
  | "matches"
  | "inARow"
  | "points"
  | "winRate"
  | "ratio"
  | "secondsPerMatch";

export interface HofTitle {
  id: HofTitleId;
  unit: HofUnit;
  /** Decimal places shown for the value. */
  decimals: 0 | 1 | 2;
}

/** One stat: the best title on the left, the worst on the right; either side may be missing. */
export interface HofRow {
  best?: HofTitle;
  worst?: HofTitle;
}

export type HofSectionId = "headline" | "form" | "fighting" | "farm" | "map";

export interface HofSection {
  id: HofSectionId;
  rows: HofRow[];
}

function title(id: HofTitleId, unit: HofUnit, decimals: 0 | 1 | 2): HofTitle {
  return { id, unit, decimals };
}

export const HOF_SECTIONS: HofSection[] = [
  {
    id: "headline",
    rows: [
      {
        best: title("mvp", "total", 0),
        worst: title("never_mvp", "matches", 0),
      },
      {
        best: title("ace", "total", 0),
        worst: title("never_ace", "matches", 0),
      },
      {
        best: title("op_score", "perMatch", 2),
        worst: title("bottom_of_ladder", "points", 0),
      },
    ],
  },
  {
    id: "form",
    rows: [
      {
        best: title("best_win_rate", "winRate", 0),
        worst: title("worst_win_rate", "winRate", 0),
      },
      {
        best: title("best_streak", "inARow", 0),
        worst: title("tilted", "inARow", 0),
      },
    ],
  },
  {
    id: "fighting",
    rows: [
      {
        best: title("most_kills", "perMatch", 1),
        worst: title("pacifist", "perMatch", 1),
      },
      {
        best: title("most_assists", "perMatch", 1),
        worst: title("lone_wolf", "perMatch", 1),
      },
      {
        best: title("damage_dealer", "perMatch", 0),
        worst: title("peashooter", "perMatch", 0),
      },
      {
        best: title("tank", "perMatch", 0),
        worst: title("cannon_fodder", "perMatch", 1),
      },
      {
        best: title("cc_king", "secondsPerMatch", 0),
        worst: title("feeder", "ratio", 2),
      },
      {
        best: title("penta_hunter", "total", 0),
      },
      {
        best: title("quadra_killer", "total", 0),
      },
    ],
  },
  {
    id: "farm",
    rows: [
      {
        best: title("best_farm", "perMatch", 1),
      },
      {
        best: title("jungle_clearer", "perMatch", 1),
      },
      {
        best: title("gold_hoarder", "perMatch", 0),
        worst: title("broke", "perMatch", 0),
      },
      {
        best: title("level_lead", "perMatch", 1),
        worst: title("behind", "perMatch", 1),
      },
    ],
  },
  {
    id: "map",
    rows: [
      {
        best: title("vision_master", "perMatch", 1),
        worst: title("blind", "perMatch", 1),
      },
      {
        best: title("life_saver", "perMatch", 0),
        worst: title("no_heals", "perMatch", 0),
      },
      {
        best: title("tower_crusher", "perMatch", 2),
        worst: title("tower_hugger", "perMatch", 2),
      },
    ],
  },
];

export const HOF_TITLES: HofTitle[] = HOF_SECTIONS.flatMap((section) =>
  section.rows.flatMap((row) => [row.best, row.worst]),
).filter((entry): entry is HofTitle => entry != null);

/** Formats a title value in its unit's scale: win rates are shares, everything else is shown as-is. */
export function formatHofValue(entry: HofTitle, value: number): string {
  const scaled = entry.unit === "winRate" ? value * 100 : value;
  const text = scaled.toLocaleString("en-US", {
    minimumFractionDigits: entry.decimals,
    maximumFractionDigits: entry.decimals,
  });
  return entry.unit === "winRate" ? `${text}%` : text;
}
