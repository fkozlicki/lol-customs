/** A player who can be picked for a roster or a pool, with the rank the ladder last recorded. */
export interface PickablePlayerView {
  /** The Riot ID, normalised: unique among the picked. */
  key: string;
  name: string;
  rankTier: string | null;
  /** "gold iv"; null when unranked, which the row says in the reader's language. */
  rankLabel: string | null;
}
