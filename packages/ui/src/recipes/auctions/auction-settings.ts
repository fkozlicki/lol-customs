/** What an auction's creator chooses besides the pool. */
export interface AuctionSettings {
  /** The creator's own team; only asked when creating. */
  teamName: string;
  /** Each captain's budget, in dollars. */
  budget: number;
  /** How long a bid stands before the player is sold. */
  bidSeconds: number;
  /** Everyone sees the draw order ahead of time. */
  revealOrder: boolean;
}
