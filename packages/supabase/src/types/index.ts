import type * as supabase from "@supabase/supabase-js";
import type { MergeDeep } from "type-fest";
import type { Database as GeneratedDatabase } from "./db";
import type { AuctionEventPayload, ForumContent, RankSnapshot } from "./json";

/**
 * The generated schema, corrected where the generator cannot know better:
 * - `jsonb` columns the app writes get their shape (`json.ts`);
 * - generated columns computed from non-null columns are never null;
 * - `auction_update_lobby` takes null for every setting it leaves as it is.
 *
 * `db.ts` stays exactly as `bun generate:types` writes it. The JSON that the auction functions build
 * is checked at runtime instead, by the schemas in `queries/auctions.ts`.
 */
export type Database = MergeDeep<
  GeneratedDatabase,
  {
    public: {
      Tables: {
        auction_players: { Row: { rank_snapshot: RankSnapshot } };
        auction_events: { Row: { payload: AuctionEventPayload } };
        forum_posts: {
          Row: { content: ForumContent };
          Insert: { content: ForumContent };
          Update: { content?: ForumContent };
        };
        forum_comments: {
          Row: { content: ForumContent };
          Insert: { content: ForumContent };
          Update: { content?: ForumContent };
        };
        ratings: { Row: { matches_played: number; qualified: boolean } };
      };
      Functions: {
        auction_update_lobby: {
          Args: {
            p_team_name: string | null;
            p_starting_budget: number | null;
            p_bid_seconds: number | null;
            p_order_visible: boolean | null;
          };
        };
      };
    };
  }
>;

export type Client = supabase.SupabaseClient<Database>;
export type Session = supabase.Session;
export type User = supabase.User;

export * as Supabase from "@supabase/supabase-js";
export type { Json } from "./db";
export type * from "./json";
