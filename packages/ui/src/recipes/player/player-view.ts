/**
 * What a profile's side panels show, as the player recipes take it. The app makes these from its
 * `players.*` queries (apps/app/src/components/player/player-view.ts); stories make them by hand.
 */

/** Someone a player shares matches with, on the same side or the other. */
export interface RelationView {
  name: string;
  /** Their profile, with the season carried. */
  href: string;
  iconId: number | null;
  matches: number;
  wins: number;
  losses: number;
  kills: number;
}

/** The most notable teammate and rival for each kind of record; null where there is none yet. */
export interface RelationsView {
  teammates: {
    mostMatches: RelationView | null;
    mostWins: RelationView | null;
    mostLosses: RelationView | null;
  };
  rivals: {
    bestRecord: RelationView | null;
    worstRecord: RelationView | null;
    mostKilled: RelationView | null;
    mostKilledBy: RelationView | null;
  };
}

/** A Hall of Fame title the player holds, already named and formatted by the app's title catalog. */
export interface HeldTitleView {
  id: string;
  title: string;
  description: string;
  /** The record, formatted: "12", "64%", "8.4". */
  value: string;
  href: string;
  /** A "worst" title is drawn dashed. */
  kind: "best" | "worst";
  /** MVP and ACE titles take their colour. */
  tone: "mvp" | "ace" | null;
}

/** The player's line on one season's track. */
export interface SeasonSummaryView {
  key: string;
  seasonNumber: number;
  href: string;
  /** The season on screen. */
  active: boolean;
  wins: number;
  losses: number;
  /** "71%". */
  winrate: string;
  /** Rounded. */
  rating: number;
}

/** One of the player's most played champions. */
export interface ChampionStatView {
  championId: number;
  matches: number;
  wins: number;
  losses: number;
  /** "7.4 / 6.1 / 9.1", per match. */
  kda: string;
  /** "71%". */
  winrate: string;
}

/** A point on the rating history: the rating after the match, in order. */
export interface RatingPointView {
  index: number;
  rating: number;
  /** When the match was played, as the tooltip shows it. */
  label: string;
}

/** Where a season began on the all-time chart. */
export interface SeasonMarkerView {
  seasonNumber: number;
  index: number;
}
