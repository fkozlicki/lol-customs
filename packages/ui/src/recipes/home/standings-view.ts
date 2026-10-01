/**
 * One player's line in the standings, as the standings recipes draw it. The app makes one from a
 * `riftRank.leaderboard` row with `toStandingsRowView`
 * (apps/app/src/components/home/standings-view.ts); stories make one by hand.
 */
export interface StandingsRowView {
  /** Stable across renders; the player's puuid. */
  key: string;
  name: string;
  /** Their profile, with the season carried. */
  href: string;
  iconId: number | null;
  /** Place in the standings; null while the player is still qualifying. */
  position: number | null;
  matchesPlayed: number;
  /** Rounded. */
  rating: number;
  wins: number;
  losses: number;
  /** "71%". */
  winrate: string;
  /** "2.70:1". */
  kdaRatio: string;
  /** "7.4 / 6.1 / 9.1". */
  kda: string;
  mvpGames: number;
  aceGames: number;
  winStreak: number | null;
  loseStreak: number | null;
  bestStreak: number | null;
}
