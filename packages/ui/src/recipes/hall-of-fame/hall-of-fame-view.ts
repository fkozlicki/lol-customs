/**
 * The Hall of Fame as its recipes draw it. The app makes this from `hallOfFame.get` with
 * `toHallOfFameView` (apps/app/src/components/hall-of-fame/hall-of-fame-view.ts), which knows the title
 * catalog: its order, its sections, and every title's name, stat and format.
 */

export interface HallOfFamePlayerView {
  key: string;
  name: string;
  /** Their profile, with the season carried. */
  href: string;
  iconId: number | null;
}

/** One title and whoever holds it; players tied on the value share it. */
export interface TitleView {
  id: string;
  /** "Butcher". */
  title: string;
  /** What the value measures: "kills / match". */
  statLabel: string;
  /** MVP and ACE titles take their colour. */
  tone: "mvp" | "ace" | null;
  holders: HallOfFamePlayerView[];
  /** The record, formatted; null while nobody holds it. */
  value: string | null;
}

export interface HallOfFameSectionView {
  id: string;
  /** "Fighting". */
  name: string;
  /** Best and worst title on the same stat, side by side. */
  pairs: [TitleView, TitleView][];
  /** Titles without a counterpart, only those somebody holds. */
  singles: TitleView[];
}

/** A player and how many best, or worst, titles they hold. */
export interface CollectorView {
  player: HallOfFamePlayerView;
  titles: number;
}

export interface HallOfFameView {
  /** The three players with the most best titles, most first. */
  mostBest: CollectorView[];
  mostWorst: CollectorView[];
  /** Sections with something to show, in the catalog's order. */
  sections: HallOfFameSectionView[];
}
