/**
 * A Hall of Fame on one track, shaped the way its recipes take it, for stories. Made up by hand: the
 * names are invented, the titles and values the kind the catalog produces.
 */
import type {
  HallOfFameView,
  HofPlayerView,
  TitleView,
} from "@v1/ui/recipes/hof/hall-of-fame-view";

const player = (name: string, iconId: number | null = 1295): HofPlayerView => ({
  key: name,
  name,
  href: `/players/${encodeURIComponent(name)}-EUNE`,
  iconId,
});

const KESTREL = player("Kestrel");
const OLD_TOM = player("Old Tom", 4568);
const NIGHTJAR = player("Nightjar", null);
const WREN = player("Wren", 588);

const title = (
  id: string,
  name: string,
  statLabel: string,
  holders: HofPlayerView[],
  value: string | null,
  tone: TitleView["tone"] = null,
): TitleView => ({ id, title: name, statLabel, tone, holders, value });

export const MVP = title("mvp", "MVP", "matches as MVP", [KESTREL], "5", "mvp");
export const TIED = title(
  "tilted",
  "Tilted",
  "losses in a row",
  [OLD_TOM, NIGHTJAR, WREN],
  "6",
);
export const UNHELD = title(
  "never_ace",
  "Never ACE",
  "matches, no ACE",
  [],
  null,
);

export const HALL_OF_FAME: HallOfFameView = {
  mostBest: [
    { player: KESTREL, titles: 7 },
    { player: WREN, titles: 3 },
    { player: OLD_TOM, titles: 1 },
  ],
  mostWorst: [
    { player: NIGHTJAR, titles: 5 },
    { player: OLD_TOM, titles: 4 },
  ],
  sections: [
    {
      id: "headline",
      name: "Ranking",
      pairs: [
        [
          MVP,
          title("never_mvp", "Never MVP", "matches, no MVP", [NIGHTJAR], "9"),
        ],
        [title("ace", "ACE", "matches as ACE", [OLD_TOM], "4", "ace"), UNHELD],
      ],
      singles: [],
    },
    {
      id: "form",
      name: "Form",
      pairs: [
        [
          title("best_win_rate", "Winner", "win rate", [KESTREL], "71%"),
          title("worst_win_rate", "Doormat", "win rate", [NIGHTJAR], "22%"),
        ],
        [title("best_streak", "On Fire", "wins in a row", [WREN], "7"), TIED],
      ],
      singles: [],
    },
    {
      id: "multikills",
      name: "Multikills",
      pairs: [],
      singles: [
        title(
          "double_trouble",
          "Double Trouble",
          "double kills",
          [KESTREL],
          "12",
        ),
        title("penta_hunter", "Penta Hunter", "pentakills", [WREN], "1"),
      ],
    },
  ],
};
