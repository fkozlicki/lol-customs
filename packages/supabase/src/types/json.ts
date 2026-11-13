/**
 * The shapes of the `jsonb` columns the app or its SQL functions write. The generator types every
 * `jsonb` column as `Json`; `index.ts` merges these in. They are type aliases, not interfaces, so they
 * stay assignable to `Json` where a function takes them. A CHECK constraint with the same JSON Schema
 * guards each column in the database (migration `*_jsonb_column_schemas.sql`), so change both
 * together. Riot's match JSON, written by Derby Sync, is not described here.
 */

/** `auction_players.rank_snapshot`: the player's Solo/Duo rank when they joined the pool. */
export type RankSnapshot = {
  soloTier: string | null;
  soloDivision: string | null;
  soloRankLabel: string;
};

/**
 * `auction_events.payload`: empty for most events. A cancellation and a sale say why, and a
 * readiness change says which way.
 */
export type AuctionEventPayload = {
  reason?: string;
  ready?: boolean;
};

/** A node of the forum editor's document. Its own attributes and children are the editor's business. */
export type ForumNode = {
  type: string;
  [attribute: string]: unknown;
};

/**
 * `forum_posts.content` and `forum_comments.content`: the editor's document, or an empty object for a
 * post without a body.
 */
export type ForumContent =
  | { type: "doc"; content: ForumNode[]; [attribute: string]: unknown }
  | Record<string, never>;
