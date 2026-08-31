export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      auction_captains: {
        Row: {
          active_slot: boolean;
          budget_remaining: number;
          joined_at: string;
          player_id: string;
          ready: boolean;
          room_id: string;
          side: string;
          team_name: string;
          user_id: string;
        };
        Insert: {
          active_slot?: boolean;
          budget_remaining: number;
          joined_at?: string;
          player_id: string;
          ready?: boolean;
          room_id: string;
          side: string;
          team_name: string;
          user_id: string;
        };
        Update: {
          active_slot?: boolean;
          budget_remaining?: number;
          joined_at?: string;
          player_id?: string;
          ready?: boolean;
          room_id?: string;
          side?: string;
          team_name?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "auction_captains_player_id_fkey";
            columns: ["player_id"];
            isOneToOne: false;
            referencedRelation: "auction_players";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "auction_captains_room_id_fkey";
            columns: ["room_id"];
            isOneToOne: false;
            referencedRelation: "auction_rooms";
            referencedColumns: ["id"];
          },
        ];
      };
      auction_events: {
        Row: {
          actor_side: string | null;
          actor_user_id: string | null;
          amount: number | null;
          created_at: string;
          event_type: string;
          id: number;
          payload: Json;
          player_id: string | null;
          request_id: string | null;
          room_id: string;
        };
        Insert: {
          actor_side?: string | null;
          actor_user_id?: string | null;
          amount?: number | null;
          created_at?: string;
          event_type: string;
          id?: never;
          payload?: Json;
          player_id?: string | null;
          request_id?: string | null;
          room_id: string;
        };
        Update: {
          actor_side?: string | null;
          actor_user_id?: string | null;
          amount?: number | null;
          created_at?: string;
          event_type?: string;
          id?: never;
          payload?: Json;
          player_id?: string | null;
          request_id?: string | null;
          room_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "auction_events_player_id_fkey";
            columns: ["player_id"];
            isOneToOne: false;
            referencedRelation: "auction_players";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "auction_events_room_id_fkey";
            columns: ["room_id"];
            isOneToOne: false;
            referencedRelation: "auction_rooms";
            referencedColumns: ["id"];
          },
        ];
      };
      auction_players: {
        Row: {
          assigned_side: string | null;
          created_at: string;
          draw_position: number | null;
          game_name: string;
          id: string;
          is_captain: boolean;
          purchase_price: number | null;
          rank_snapshot: Json;
          revealed: boolean;
          riot_id_normalized: string | null;
          room_id: string;
          tag_line: string;
        };
        Insert: {
          assigned_side?: string | null;
          created_at?: string;
          draw_position?: number | null;
          game_name: string;
          id?: string;
          is_captain?: boolean;
          purchase_price?: number | null;
          rank_snapshot?: Json;
          revealed?: boolean;
          riot_id_normalized?: string | null;
          room_id: string;
          tag_line: string;
        };
        Update: {
          assigned_side?: string | null;
          created_at?: string;
          draw_position?: number | null;
          game_name?: string;
          id?: string;
          is_captain?: boolean;
          purchase_price?: number | null;
          rank_snapshot?: Json;
          revealed?: boolean;
          riot_id_normalized?: string | null;
          room_id?: string;
          tag_line?: string;
        };
        Relationships: [
          {
            foreignKeyName: "auction_players_room_id_fkey";
            columns: ["room_id"];
            isOneToOne: false;
            referencedRelation: "auction_rooms";
            referencedColumns: ["id"];
          },
        ];
      };
      auction_rooms: {
        Row: {
          bid_deadline: string | null;
          bid_seconds: number;
          countdown_ends_at: string | null;
          created_at: string;
          creator_id: string;
          current_bid: number;
          current_player_id: string | null;
          id: string;
          last_activity_at: string;
          leading_side: string | null;
          order_visible: boolean;
          phase: string | null;
          phase_deadline: string | null;
          starting_budget: number;
          state_version: number;
          status: string;
          terminal_at: string | null;
          updated_at: string;
        };
        Insert: {
          bid_deadline?: string | null;
          bid_seconds?: number;
          countdown_ends_at?: string | null;
          created_at?: string;
          creator_id: string;
          current_bid?: number;
          current_player_id?: string | null;
          id?: string;
          last_activity_at?: string;
          leading_side?: string | null;
          order_visible?: boolean;
          phase?: string | null;
          phase_deadline?: string | null;
          starting_budget?: number;
          state_version?: number;
          status?: string;
          terminal_at?: string | null;
          updated_at?: string;
        };
        Update: {
          bid_deadline?: string | null;
          bid_seconds?: number;
          countdown_ends_at?: string | null;
          created_at?: string;
          creator_id?: string;
          current_bid?: number;
          current_player_id?: string | null;
          id?: string;
          last_activity_at?: string;
          leading_side?: string | null;
          order_visible?: boolean;
          phase?: string | null;
          phase_deadline?: string | null;
          starting_budget?: number;
          state_version?: number;
          status?: string;
          terminal_at?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "auction_rooms_current_player_fkey";
            columns: ["current_player_id"];
            isOneToOne: false;
            referencedRelation: "auction_players";
            referencedColumns: ["id"];
          },
        ];
      };
      forum_comment_reactions: {
        Row: {
          comment_id: string;
          type: string;
          user_id: string;
        };
        Insert: {
          comment_id: string;
          type: string;
          user_id: string;
        };
        Update: {
          comment_id?: string;
          type?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "forum_comment_reactions_comment_id_fkey";
            columns: ["comment_id"];
            isOneToOne: false;
            referencedRelation: "forum_comments";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "forum_comment_reactions_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "user_profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      forum_comments: {
        Row: {
          author_id: string;
          content: Json;
          created_at: string;
          id: string;
          post_id: string;
        };
        Insert: {
          author_id: string;
          content?: Json;
          created_at?: string;
          id?: string;
          post_id: string;
        };
        Update: {
          author_id?: string;
          content?: Json;
          created_at?: string;
          id?: string;
          post_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "forum_comments_author_id_fkey";
            columns: ["author_id"];
            isOneToOne: false;
            referencedRelation: "user_profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "forum_comments_post_id_fkey";
            columns: ["post_id"];
            isOneToOne: false;
            referencedRelation: "forum_posts";
            referencedColumns: ["id"];
          },
        ];
      };
      forum_posts: {
        Row: {
          author_id: string;
          content: Json;
          created_at: string;
          id: string;
          title: string;
        };
        Insert: {
          author_id: string;
          content?: Json;
          created_at?: string;
          id?: string;
          title: string;
        };
        Update: {
          author_id?: string;
          content?: Json;
          created_at?: string;
          id?: string;
          title?: string;
        };
        Relationships: [
          {
            foreignKeyName: "forum_posts_author_id_fkey";
            columns: ["author_id"];
            isOneToOne: false;
            referencedRelation: "user_profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      forum_reactions: {
        Row: {
          post_id: string;
          type: string;
          user_id: string;
        };
        Insert: {
          post_id: string;
          type: string;
          user_id: string;
        };
        Update: {
          post_id?: string;
          type?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "forum_reactions_post_id_fkey";
            columns: ["post_id"];
            isOneToOne: false;
            referencedRelation: "forum_posts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "forum_reactions_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "user_profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      match_kills: {
        Row: {
          killer_participant_id: number;
          match_id: number;
          victim_participant_id: number;
        };
        Insert: {
          killer_participant_id: number;
          match_id: number;
          victim_participant_id: number;
        };
        Update: {
          killer_participant_id?: number;
          match_id?: number;
          victim_participant_id?: number;
        };
        Relationships: [
          {
            foreignKeyName: "match_kills_match_id_fkey";
            columns: ["match_id"];
            isOneToOne: false;
            referencedRelation: "matches";
            referencedColumns: ["match_id"];
          },
        ];
      };
      match_participants: {
        Row: {
          assists: number | null;
          champ_level: number | null;
          champion_id: number | null;
          damage_self_mitigated: number | null;
          deaths: number | null;
          double_kills: number | null;
          gold_earned: number | null;
          gold_spent: number | null;
          inhibitor_kills: number | null;
          is_ace: boolean;
          is_mvp: boolean;
          kills: number | null;
          lane: string | null;
          largest_killing_spree: number | null;
          largest_multi_kill: number | null;
          magic_damage_dealt: number | null;
          match_id: number;
          neutral_minions_killed: number | null;
          op_score: number | null;
          participant_id: number | null;
          penta_kills: number | null;
          perk_primary_style: number | null;
          perk_sub_style: number | null;
          physical_damage_dealt: number | null;
          puuid: string;
          quadra_kills: number | null;
          rank_division: string | null;
          rank_tier: string | null;
          role: string | null;
          spell1_id: number | null;
          spell2_id: number | null;
          team_id: number | null;
          time_ccing_others: number | null;
          total_damage_dealt: number | null;
          total_damage_dealt_to_champions: number | null;
          total_damage_taken: number | null;
          total_heal: number | null;
          total_minions_killed: number | null;
          total_time_cc_dealt: number | null;
          triple_kills: number | null;
          true_damage_dealt: number | null;
          turret_kills: number | null;
          vision_score: number | null;
          wards_killed: number | null;
          wards_placed: number | null;
          win: boolean | null;
        };
        Insert: {
          assists?: number | null;
          champ_level?: number | null;
          champion_id?: number | null;
          damage_self_mitigated?: number | null;
          deaths?: number | null;
          double_kills?: number | null;
          gold_earned?: number | null;
          gold_spent?: number | null;
          inhibitor_kills?: number | null;
          is_ace?: boolean;
          is_mvp?: boolean;
          kills?: number | null;
          lane?: string | null;
          largest_killing_spree?: number | null;
          largest_multi_kill?: number | null;
          magic_damage_dealt?: number | null;
          match_id: number;
          neutral_minions_killed?: number | null;
          op_score?: number | null;
          participant_id?: number | null;
          penta_kills?: number | null;
          perk_primary_style?: number | null;
          perk_sub_style?: number | null;
          physical_damage_dealt?: number | null;
          puuid: string;
          quadra_kills?: number | null;
          rank_division?: string | null;
          rank_tier?: string | null;
          role?: string | null;
          spell1_id?: number | null;
          spell2_id?: number | null;
          team_id?: number | null;
          time_ccing_others?: number | null;
          total_damage_dealt?: number | null;
          total_damage_dealt_to_champions?: number | null;
          total_damage_taken?: number | null;
          total_heal?: number | null;
          total_minions_killed?: number | null;
          total_time_cc_dealt?: number | null;
          triple_kills?: number | null;
          true_damage_dealt?: number | null;
          turret_kills?: number | null;
          vision_score?: number | null;
          wards_killed?: number | null;
          wards_placed?: number | null;
          win?: boolean | null;
        };
        Update: {
          assists?: number | null;
          champ_level?: number | null;
          champion_id?: number | null;
          damage_self_mitigated?: number | null;
          deaths?: number | null;
          double_kills?: number | null;
          gold_earned?: number | null;
          gold_spent?: number | null;
          inhibitor_kills?: number | null;
          is_ace?: boolean;
          is_mvp?: boolean;
          kills?: number | null;
          lane?: string | null;
          largest_killing_spree?: number | null;
          largest_multi_kill?: number | null;
          magic_damage_dealt?: number | null;
          match_id?: number;
          neutral_minions_killed?: number | null;
          op_score?: number | null;
          participant_id?: number | null;
          penta_kills?: number | null;
          perk_primary_style?: number | null;
          perk_sub_style?: number | null;
          physical_damage_dealt?: number | null;
          puuid?: string;
          quadra_kills?: number | null;
          rank_division?: string | null;
          rank_tier?: string | null;
          role?: string | null;
          spell1_id?: number | null;
          spell2_id?: number | null;
          team_id?: number | null;
          time_ccing_others?: number | null;
          total_damage_dealt?: number | null;
          total_damage_dealt_to_champions?: number | null;
          total_damage_taken?: number | null;
          total_heal?: number | null;
          total_minions_killed?: number | null;
          total_time_cc_dealt?: number | null;
          triple_kills?: number | null;
          true_damage_dealt?: number | null;
          turret_kills?: number | null;
          vision_score?: number | null;
          wards_killed?: number | null;
          wards_placed?: number | null;
          win?: boolean | null;
        };
        Relationships: [
          {
            foreignKeyName: "match_participants_match_id_fkey";
            columns: ["match_id"];
            isOneToOne: false;
            referencedRelation: "matches";
            referencedColumns: ["match_id"];
          },
          {
            foreignKeyName: "match_participants_puuid_fkey";
            columns: ["puuid"];
            isOneToOne: false;
            referencedRelation: "players";
            referencedColumns: ["puuid"];
          },
        ];
      };
      matches: {
        Row: {
          created_at: string | null;
          duration: number;
          end_of_game_result: string | null;
          game_creation: string;
          game_mode: string | null;
          game_type: string | null;
          map_id: number | null;
          match_id: number;
          patch: string | null;
          platform_id: string;
          queue_id: number | null;
          raw_json: Json;
          season_id: number | null;
          timeline_json: Json;
        };
        Insert: {
          created_at?: string | null;
          duration: number;
          end_of_game_result?: string | null;
          game_creation: string;
          game_mode?: string | null;
          game_type?: string | null;
          map_id?: number | null;
          match_id: number;
          patch?: string | null;
          platform_id: string;
          queue_id?: number | null;
          raw_json: Json;
          season_id?: number | null;
          timeline_json?: Json;
        };
        Update: {
          created_at?: string | null;
          duration?: number;
          end_of_game_result?: string | null;
          game_creation?: string;
          game_mode?: string | null;
          game_type?: string | null;
          map_id?: number | null;
          match_id?: number;
          patch?: string | null;
          platform_id?: string;
          queue_id?: number | null;
          raw_json?: Json;
          season_id?: number | null;
          timeline_json?: Json;
        };
        Relationships: [];
      };
      players: {
        Row: {
          first_seen_at: string | null;
          game_name: string | null;
          last_seen_at: string | null;
          platform_id: string | null;
          profile_icon: number | null;
          puuid: string;
          tag_line: string | null;
        };
        Insert: {
          first_seen_at?: string | null;
          game_name?: string | null;
          last_seen_at?: string | null;
          platform_id?: string | null;
          profile_icon?: number | null;
          puuid: string;
          tag_line?: string | null;
        };
        Update: {
          first_seen_at?: string | null;
          game_name?: string | null;
          last_seen_at?: string | null;
          platform_id?: string | null;
          profile_icon?: number | null;
          puuid?: string;
          tag_line?: string | null;
        };
        Relationships: [];
      };
      rating_history: {
        Row: {
          ace_games: number | null;
          avg_assists: number | null;
          avg_deaths: number | null;
          avg_kills: number | null;
          best_streak: number | null;
          created_at: string | null;
          lose_streak: number | null;
          losses: number | null;
          match_id: number;
          mvp_games: number | null;
          puuid: string;
          rating_after: number | null;
          win_streak: number | null;
          wins: number | null;
        };
        Insert: {
          ace_games?: number | null;
          avg_assists?: number | null;
          avg_deaths?: number | null;
          avg_kills?: number | null;
          best_streak?: number | null;
          created_at?: string | null;
          lose_streak?: number | null;
          losses?: number | null;
          match_id: number;
          mvp_games?: number | null;
          puuid: string;
          rating_after?: number | null;
          win_streak?: number | null;
          wins?: number | null;
        };
        Update: {
          ace_games?: number | null;
          avg_assists?: number | null;
          avg_deaths?: number | null;
          avg_kills?: number | null;
          best_streak?: number | null;
          created_at?: string | null;
          lose_streak?: number | null;
          losses?: number | null;
          match_id?: number;
          mvp_games?: number | null;
          puuid?: string;
          rating_after?: number | null;
          win_streak?: number | null;
          wins?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "rating_history_match_id_fkey";
            columns: ["match_id"];
            isOneToOne: false;
            referencedRelation: "matches";
            referencedColumns: ["match_id"];
          },
          {
            foreignKeyName: "rating_history_puuid_fkey";
            columns: ["puuid"];
            isOneToOne: false;
            referencedRelation: "players";
            referencedColumns: ["puuid"];
          },
        ];
      };
      ratings: {
        Row: {
          ace_games: number;
          avg_assists: number | null;
          avg_cc_time: number | null;
          avg_champ_level: number | null;
          avg_cs: number | null;
          avg_damage_taken: number | null;
          avg_damage_to_champions: number | null;
          avg_deaths: number | null;
          avg_gold_earned: number | null;
          avg_gold_spent: number | null;
          avg_heal: number | null;
          avg_kda: number | null;
          avg_kills: number | null;
          avg_neutral_minions: number | null;
          avg_op_score: number | null;
          avg_turret_kills: number | null;
          avg_vision_score: number | null;
          best_streak: number | null;
          lose_streak: number | null;
          losses: number | null;
          mvp_games: number;
          puuid: string;
          rating: number | null;
          total_penta_kills: number;
          total_quadra_kills: number;
          total_triple_kills: number;
          updated_at: string | null;
          win_streak: number | null;
          wins: number | null;
        };
        Insert: {
          ace_games?: number;
          avg_assists?: number | null;
          avg_cc_time?: number | null;
          avg_champ_level?: number | null;
          avg_cs?: number | null;
          avg_damage_taken?: number | null;
          avg_damage_to_champions?: number | null;
          avg_deaths?: number | null;
          avg_gold_earned?: number | null;
          avg_gold_spent?: number | null;
          avg_heal?: number | null;
          avg_kda?: number | null;
          avg_kills?: number | null;
          avg_neutral_minions?: number | null;
          avg_op_score?: number | null;
          avg_turret_kills?: number | null;
          avg_vision_score?: number | null;
          best_streak?: number | null;
          lose_streak?: number | null;
          losses?: number | null;
          mvp_games?: number;
          puuid: string;
          rating?: number | null;
          total_penta_kills?: number;
          total_quadra_kills?: number;
          total_triple_kills?: number;
          updated_at?: string | null;
          win_streak?: number | null;
          wins?: number | null;
        };
        Update: {
          ace_games?: number;
          avg_assists?: number | null;
          avg_cc_time?: number | null;
          avg_champ_level?: number | null;
          avg_cs?: number | null;
          avg_damage_taken?: number | null;
          avg_damage_to_champions?: number | null;
          avg_deaths?: number | null;
          avg_gold_earned?: number | null;
          avg_gold_spent?: number | null;
          avg_heal?: number | null;
          avg_kda?: number | null;
          avg_kills?: number | null;
          avg_neutral_minions?: number | null;
          avg_op_score?: number | null;
          avg_turret_kills?: number | null;
          avg_vision_score?: number | null;
          best_streak?: number | null;
          lose_streak?: number | null;
          losses?: number | null;
          mvp_games?: number;
          puuid?: string;
          rating?: number | null;
          total_penta_kills?: number;
          total_quadra_kills?: number;
          total_triple_kills?: number;
          updated_at?: string | null;
          win_streak?: number | null;
          wins?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "ratings_puuid_fkey";
            columns: ["puuid"];
            isOneToOne: true;
            referencedRelation: "players";
            referencedColumns: ["puuid"];
          },
        ];
      };
      teams: {
        Row: {
          baron_kills: number | null;
          dragon_kills: number | null;
          first_baron: boolean | null;
          first_blood: boolean | null;
          first_tower: boolean | null;
          inhibitor_kills: number | null;
          match_id: number;
          rift_herald_kills: number | null;
          team_id: number;
          tower_kills: number | null;
          win: boolean | null;
        };
        Insert: {
          baron_kills?: number | null;
          dragon_kills?: number | null;
          first_baron?: boolean | null;
          first_blood?: boolean | null;
          first_tower?: boolean | null;
          inhibitor_kills?: number | null;
          match_id: number;
          rift_herald_kills?: number | null;
          team_id: number;
          tower_kills?: number | null;
          win?: boolean | null;
        };
        Update: {
          baron_kills?: number | null;
          dragon_kills?: number | null;
          first_baron?: boolean | null;
          first_blood?: boolean | null;
          first_tower?: boolean | null;
          inhibitor_kills?: number | null;
          match_id?: number;
          rift_herald_kills?: number | null;
          team_id?: number;
          tower_kills?: number | null;
          win?: boolean | null;
        };
        Relationships: [
          {
            foreignKeyName: "teams_match_id_fkey";
            columns: ["match_id"];
            isOneToOne: false;
            referencedRelation: "matches";
            referencedColumns: ["match_id"];
          },
        ];
      };
      user_profiles: {
        Row: {
          avatar_url: string | null;
          created_at: string;
          id: string;
          nickname: string;
        };
        Insert: {
          avatar_url?: string | null;
          created_at?: string;
          id: string;
          nickname: string;
        };
        Update: {
          avatar_url?: string | null;
          created_at?: string;
          id?: string;
          nickname?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      _auction_actor_id: { Args: never; Returns: string };
      _auction_fail: { Args: { p_code: string }; Returns: undefined };
      _auction_request_room: {
        Args: { p_actor_id: string; p_request_id: string };
        Returns: string;
      };
      _auction_reveal_next_locked: {
        Args: { p_room_id: string };
        Returns: undefined;
      };
      _auction_sell_locked: {
        Args: { p_reason: string; p_room_id: string };
        Returns: undefined;
      };
      _auction_set_terminal_locked: {
        Args: { p_room_id: string; p_status: string };
        Returns: undefined;
      };
      _auction_snapshot: {
        Args: { p_room_id: string; p_viewer_id: string };
        Returns: Json;
      };
      _auction_start_locked: {
        Args: { p_room_id: string };
        Returns: undefined;
      };
      _compute_op_scores_fallback: {
        Args: { p_match_id: number; v_duration_sec: number };
        Returns: undefined;
      };
      _compute_op_scores_timeline: {
        Args: {
          p_match_id: number;
          v_cadence_sec: number;
          v_duration_sec: number;
          v_timeline: Json;
        };
        Returns: undefined;
      };
      _op_effective_role_bucket: {
        Args: {
          p_lane: string;
          p_lobby_count: number;
          p_map_id: number;
          p_minions: number;
          p_neutral: number;
          p_participant_id: number;
          p_role: string;
        };
        Returns: string;
      };
      _op_role_bucket: {
        Args: {
          p_lane: string;
          p_minions: number;
          p_neutral: number;
          p_role: string;
        };
        Returns: string;
      };
      apply_rating_update_for_match: {
        Args: { p_match_id: number };
        Returns: undefined;
      };
      auction_bid: {
        Args: { p_amount: number; p_request_id: string; p_room_id: string };
        Returns: Json;
      };
      auction_cancel: {
        Args: { p_request_id: string; p_room_id: string };
        Returns: Json;
      };
      auction_create_room: {
        Args: {
          p_bid_seconds: number;
          p_captain_riot_id: string;
          p_order_visible: boolean;
          p_players: Json;
          p_request_id: string;
          p_starting_budget: number;
          p_team_name: string;
        };
        Returns: Json;
      };
      auction_get_room: { Args: { p_room_id: string }; Returns: Json };
      auction_join_captain: {
        Args: {
          p_player_id: string;
          p_request_id: string;
          p_room_id: string;
          p_team_name: string;
        };
        Returns: Json;
      };
      auction_leave_captain: {
        Args: { p_request_id: string; p_room_id: string };
        Returns: Json;
      };
      auction_list_active: {
        Args: never;
        Returns: {
          room: Json;
        }[];
      };
      auction_pass: {
        Args: { p_request_id: string; p_room_id: string };
        Returns: Json;
      };
      auction_remove_captain: {
        Args: { p_request_id: string; p_room_id: string };
        Returns: Json;
      };
      auction_set_ready: {
        Args: { p_ready: boolean; p_request_id: string; p_room_id: string };
        Returns: Json;
      };
      auction_tick: { Args: never; Returns: number };
      auction_update_lobby: {
        Args: {
          p_bid_seconds: number;
          p_order_visible: boolean;
          p_players: Json;
          p_request_id: string;
          p_room_id: string;
          p_starting_budget: number;
          p_team_name: string;
        };
        Returns: Json;
      };
      compute_op_scores_for_match: {
        Args: { p_match_id: number };
        Returns: undefined;
      };
      compute_player_streaks: {
        Args: { p_puuid: string; p_through_match_id: number };
        Returns: {
          best_streak: number;
          lose_streak: number;
          win_streak: number;
        }[];
      };
      leaderboard_at: {
        Args: { p_at: string; p_limit?: number };
        Returns: {
          ace_games: number;
          avg_assists: number;
          avg_deaths: number;
          avg_kills: number;
          best_streak: number;
          game_name: string;
          lose_streak: number;
          losses: number;
          mvp_games: number;
          platform_id: string;
          profile_icon: number;
          puuid: string;
          rating: number;
          tag_line: string;
          updated_at: string;
          win_streak: number;
          wins: number;
        }[];
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  "public"
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {},
  },
} as const;
