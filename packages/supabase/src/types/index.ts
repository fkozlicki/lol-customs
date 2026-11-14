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

/** The name and icon a left join to `players` adds: null for a player not in `players`. */
type PlayerNameColumns = {
  game_name: string | null;
  tag_line: string | null;
  profile_icon: number | null;
};

/**
 * The generated schema, corrected where the generator cannot know better:
 * - forum content, which the app writes and reads, gets its shape (`json.ts`);
 * - the `forum_post_list` view's columns are as non-null as the table's, and its counts too;
 * - functions returning a table admit the nulls their left joins produce;
 * - `auction_update_lobby` takes null for every setting it leaves as it is.
 *
 * `db.ts` stays exactly as `bun generate:types` writes it. The auction JSON columns are written through
 * the auction functions and read only through the snapshot they build, whose JSON
 * `queries/auctions.ts` checks at runtime; they need no override here.
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
      };
      Views: {
        forum_post_list: {
          Row: {
            id: string;
            title: string;
            content: ForumContent;
            created_at: string;
            author_id: string;
            likes: number;
            dislikes: number;
            comment_count: number;
          };
        };
      };
      Functions: {
        leaderboard_at: { Returns: LeaderboardAtRow[] };
        standings_after_match: { Returns: LeaderboardAtRow[] };
        player_relations: {
          Returns: ({
            relation: string;
            other_puuid: string;
            matches: number | null;
            wins: number | null;
            losses: number | null;
            kills: number | null;
          } & PlayerNameColumns)[];
        };
        hall_of_fame: {
          Returns: ({
            title: string;
            puuid: string;
            value: number;
          } & PlayerNameColumns)[];
        };
        latest_ranks_by_riot_id: {
          Returns: {
            ordinal: number;
            rank_tier: string | null;
            rank_division: string | null;
          }[];
        };
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
