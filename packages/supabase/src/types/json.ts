import { z } from "zod";

/**
 * The shapes of the `jsonb` values the app and its SQL functions write, as Zod schemas: each schema is
 * the TypeScript type (`z.infer`) and, where data crosses a boundary, its check. In the database a
 * CHECK constraint with the matching JSON Schema guards the column
 * (`migrations/*_jsonb_column_schemas.sql`), so change both together. Riot's match JSON, written by
 * Derby Sync, is not described here.
 */

/** `auction_players.rank_snapshot`: the player's Solo/Duo rank when they joined the pool. */
export const rankSnapshot = z.object({
  soloTier: z.string().nullable(),
  soloDivision: z.string().nullable(),
  soloRankLabel: z.string(),
});
export type RankSnapshot = z.infer<typeof rankSnapshot>;

/**
 * `auction_events.payload`: empty for most events. A cancellation and a sale say why, and a
 * readiness change says which way.
 */
export const auctionEventPayload = z.object({
  reason: z.string().optional(),
  ready: z.boolean().optional(),
});
export type AuctionEventPayload = z.infer<typeof auctionEventPayload>;

/** One entry of the pool an auction is created or edited with (`p_players`). */
export type AuctionPoolEntry = {
  gameName: string;
  tagLine: string;
  rank: RankSnapshot;
};

/**
 * `forum_posts.content` and `forum_comments.content`: the editor's document, of nodes that each have
 * a type, or an empty object for a post without a body. Only the outline is checked: what the nodes
 * hold is the editor's business.
 */
export const forumContent = z.union([
  z.record(z.string(), z.never()),
  z.looseObject({
    type: z.literal("doc"),
    content: z.array(z.looseObject({ type: z.string() })),
  }),
]);
export type ForumContent = z.infer<typeof forumContent>;
