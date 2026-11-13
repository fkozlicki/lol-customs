import type * as supabase from "@supabase/supabase-js";
import type { MergeDeep } from "type-fest";
import type { Database as GeneratedDatabase } from "./db";
import type { ForumContent } from "./json";

/**
 * A row of `leaderboard_at`. The generator types every column of a `RETURNS TABLE` function as
 * non-null, but the player's name, icon and averages come from a left join and can be null.
 */
type LeaderboardAtRow = {
  puuid: string;
  rating: number;
  wins: number;
  losses: number;
  best_streak: number;
  win_streak: number;
  lose_streak: number;
  updated_at: string;
  avg_kills: number | null;
  avg_deaths: number | null;
  avg_assists: number | null;
  mvp_games: number;
  ace_games: number;
  game_name: string | null;
  tag_line: string | null;
  profile_icon: number | null;
  platform_id: string | null;
  qualified: boolean;
};

/**
 * The generated schema, corrected where the generator cannot know better:
 * - forum content, which the app writes and reads, gets its shape (`json.ts`);
 * - generated columns computed from non-null columns are never null;
 * - `leaderboard_at` admits the nulls its left join produces;
 * - `auction_update_lobby` takes null for every setting it leaves as it is.
 *
 * `db.ts` stays exactly as `bun generate:types` writes it. The auction JSON columns are only written
 * and read in SQL; the JSON the auction functions return is checked at runtime by
 * `queries/auctions.ts`.
 */
export type Database = MergeDeep<
  GeneratedDatabase,
  {
    public: {
      Tables: {
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
        leaderboard_at: { Returns: LeaderboardAtRow[] };
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
export * from "./json";
