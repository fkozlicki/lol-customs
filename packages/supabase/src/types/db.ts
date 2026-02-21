export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      match_participants: {
        Row: {
          assists: number | null
          champ_level: number | null
          champion_id: number | null
          damage_self_mitigated: number | null
          deaths: number | null
          double_kills: number | null
          gold_earned: number | null
          gold_spent: number | null
          inhibitor_kills: number | null
          is_ace: boolean
          is_mvp: boolean
          kills: number | null
          lane: string | null
          largest_killing_spree: number | null
          largest_multi_kill: number | null
          magic_damage_dealt: number | null
          match_id: number
          neutral_minions_killed: number | null
          op_score: number | null
          participant_id: number | null
          penta_kills: number | null
          perk_primary_style: number | null
          perk_sub_style: number | null
          physical_damage_dealt: number | null
          puuid: string
          quadra_kills: number | null
          rank_division: string | null
          rank_tier: string | null
          role: string | null
          spell1_id: number | null
          spell2_id: number | null
          team_id: number | null
          time_ccing_others: number | null
          total_damage_dealt: number | null
          total_damage_dealt_to_champions: number | null
          total_damage_taken: number | null
          total_heal: number | null
          total_minions_killed: number | null
          total_time_cc_dealt: number | null
          triple_kills: number | null
          true_damage_dealt: number | null
          turret_kills: number | null
          vision_score: number | null
          wards_killed: number | null
          wards_placed: number | null
          win: boolean | null
        }
        Insert: {
          assists?: number | null
          champ_level?: number | null
          champion_id?: number | null
          damage_self_mitigated?: number | null
          deaths?: number | null
          double_kills?: number | null
          gold_earned?: number | null
          gold_spent?: number | null
          inhibitor_kills?: number | null
          is_ace?: boolean
          is_mvp?: boolean
          kills?: number | null
          lane?: string | null
          largest_killing_spree?: number | null
          largest_multi_kill?: number | null
          magic_damage_dealt?: number | null
          match_id: number
          neutral_minions_killed?: number | null
          op_score?: number | null
          participant_id?: number | null
          penta_kills?: number | null
          perk_primary_style?: number | null
          perk_sub_style?: number | null
          physical_damage_dealt?: number | null
          puuid: string
          quadra_kills?: number | null
          rank_division?: string | null
          rank_tier?: string | null
          role?: string | null
          spell1_id?: number | null
          spell2_id?: number | null
          team_id?: number | null
          time_ccing_others?: number | null
          total_damage_dealt?: number | null
          total_damage_dealt_to_champions?: number | null
          total_damage_taken?: number | null
          total_heal?: number | null
          total_minions_killed?: number | null
          total_time_cc_dealt?: number | null
          triple_kills?: number | null
          true_damage_dealt?: number | null
          turret_kills?: number | null
          vision_score?: number | null
          wards_killed?: number | null
          wards_placed?: number | null
          win?: boolean | null
        }
        Update: {
          assists?: number | null
          champ_level?: number | null
          champion_id?: number | null
          damage_self_mitigated?: number | null
          deaths?: number | null
          double_kills?: number | null
          gold_earned?: number | null
          gold_spent?: number | null
          inhibitor_kills?: number | null
          is_ace?: boolean
          is_mvp?: boolean
          kills?: number | null
          lane?: string | null
          largest_killing_spree?: number | null
          largest_multi_kill?: number | null
          magic_damage_dealt?: number | null
          match_id?: number
          neutral_minions_killed?: number | null
          op_score?: number | null
          participant_id?: number | null
          penta_kills?: number | null
          perk_primary_style?: number | null
          perk_sub_style?: number | null
          physical_damage_dealt?: number | null
          puuid?: string
          quadra_kills?: number | null
          rank_division?: string | null
          rank_tier?: string | null
          role?: string | null
          spell1_id?: number | null
          spell2_id?: number | null
          team_id?: number | null
          time_ccing_others?: number | null
          total_damage_dealt?: number | null
          total_damage_dealt_to_champions?: number | null
          total_damage_taken?: number | null
          total_heal?: number | null
          total_minions_killed?: number | null
          total_time_cc_dealt?: number | null
          triple_kills?: number | null
          true_damage_dealt?: number | null
          turret_kills?: number | null
          vision_score?: number | null
          wards_killed?: number | null
          wards_placed?: number | null
          win?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "match_participants_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["match_id"]
          },
          {
            foreignKeyName: "match_participants_puuid_fkey"
            columns: ["puuid"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["puuid"]
          },
        ]
      }
      matches: {
        Row: {
          created_at: string | null
          duration: number
          end_of_game_result: string | null
          game_creation: string
          game_mode: string | null
          game_type: string | null
          map_id: number | null
          match_id: number
          patch: string | null
          platform_id: string
          queue_id: number | null
          raw_json: Json
          season_id: number | null
          timeline_json: Json
        }
        Insert: {
          created_at?: string | null
          duration: number
          end_of_game_result?: string | null
          game_creation: string
          game_mode?: string | null
          game_type?: string | null
          map_id?: number | null
          match_id: number
          patch?: string | null
          platform_id: string
          queue_id?: number | null
          raw_json: Json
          season_id?: number | null
          timeline_json?: Json
        }
        Update: {
          created_at?: string | null
          duration?: number
          end_of_game_result?: string | null
          game_creation?: string
          game_mode?: string | null
          game_type?: string | null
          map_id?: number | null
          match_id?: number
          patch?: string | null
          platform_id?: string
          queue_id?: number | null
          raw_json?: Json
          season_id?: number | null
          timeline_json?: Json
        }
        Relationships: []
      }
      players: {
        Row: {
          first_seen_at: string | null
          game_name: string | null
          last_seen_at: string | null
          platform_id: string | null
          profile_icon: number | null
          puuid: string
          tag_line: string | null
        }
        Insert: {
          first_seen_at?: string | null
          game_name?: string | null
          last_seen_at?: string | null
          platform_id?: string | null
          profile_icon?: number | null
          puuid: string
          tag_line?: string | null
        }
        Update: {
          first_seen_at?: string | null
          game_name?: string | null
          last_seen_at?: string | null
          platform_id?: string | null
          profile_icon?: number | null
          puuid?: string
          tag_line?: string | null
        }
        Relationships: []
      }
      rating_history: {
        Row: {
          created_at: string | null
          match_id: number
          puuid: string
          rating_after: number | null
        }
        Insert: {
          created_at?: string | null
          match_id: number
          puuid: string
          rating_after?: number | null
        }
        Update: {
          created_at?: string | null
          match_id?: number
          puuid?: string
          rating_after?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "rating_history_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["match_id"]
          },
          {
            foreignKeyName: "rating_history_puuid_fkey"
            columns: ["puuid"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["puuid"]
          },
        ]
      }
      ratings: {
        Row: {
          ace_games: number
          avg_assists: number | null
          avg_cc_time: number | null
          avg_champ_level: number | null
          avg_cs: number | null
          avg_damage_taken: number | null
          avg_damage_to_champions: number | null
          avg_deaths: number | null
          avg_gold_earned: number | null
          avg_gold_spent: number | null
          avg_heal: number | null
          avg_kda: number | null
          avg_kills: number | null
          avg_neutral_minions: number | null
          avg_op_score: number | null
          avg_turret_kills: number | null
          avg_vision_score: number | null
          best_streak: number | null
          lose_streak: number | null
          losses: number | null
          mvp_games: number
          puuid: string
          rating: number | null
          total_penta_kills: number
          total_quadra_kills: number
          total_triple_kills: number
          updated_at: string | null
          win_streak: number | null
          wins: number | null
        }
        Insert: {
          ace_games?: number
          avg_assists?: number | null
          avg_cc_time?: number | null
          avg_champ_level?: number | null
          avg_cs?: number | null
          avg_damage_taken?: number | null
          avg_damage_to_champions?: number | null
          avg_deaths?: number | null
          avg_gold_earned?: number | null
          avg_gold_spent?: number | null
          avg_heal?: number | null
          avg_kda?: number | null
          avg_kills?: number | null
          avg_neutral_minions?: number | null
          avg_op_score?: number | null
          avg_turret_kills?: number | null
          avg_vision_score?: number | null
          best_streak?: number | null
          lose_streak?: number | null
          losses?: number | null
          mvp_games?: number
          puuid: string
          rating?: number | null
          total_penta_kills?: number
          total_quadra_kills?: number
          total_triple_kills?: number
          updated_at?: string | null
          win_streak?: number | null
          wins?: number | null
        }
        Update: {
          ace_games?: number
          avg_assists?: number | null
          avg_cc_time?: number | null
          avg_champ_level?: number | null
          avg_cs?: number | null
          avg_damage_taken?: number | null
          avg_damage_to_champions?: number | null
          avg_deaths?: number | null
          avg_gold_earned?: number | null
          avg_gold_spent?: number | null
          avg_heal?: number | null
          avg_kda?: number | null
          avg_kills?: number | null
          avg_neutral_minions?: number | null
          avg_op_score?: number | null
          avg_turret_kills?: number | null
          avg_vision_score?: number | null
          best_streak?: number | null
          lose_streak?: number | null
          losses?: number | null
          mvp_games?: number
          puuid?: string
          rating?: number | null
          total_penta_kills?: number
          total_quadra_kills?: number
          total_triple_kills?: number
          updated_at?: string | null
          win_streak?: number | null
          wins?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ratings_puuid_fkey"
            columns: ["puuid"]
            isOneToOne: true
            referencedRelation: "players"
            referencedColumns: ["puuid"]
          },
        ]
      }
      teams: {
        Row: {
          baron_kills: number | null
          dragon_kills: number | null
          first_baron: boolean | null
          first_blood: boolean | null
          first_tower: boolean | null
          inhibitor_kills: number | null
          match_id: number
          rift_herald_kills: number | null
          team_id: number
          tower_kills: number | null
          win: boolean | null
        }
        Insert: {
          baron_kills?: number | null
          dragon_kills?: number | null
          first_baron?: boolean | null
          first_blood?: boolean | null
          first_tower?: boolean | null
          inhibitor_kills?: number | null
          match_id: number
          rift_herald_kills?: number | null
          team_id: number
          tower_kills?: number | null
          win?: boolean | null
        }
        Update: {
          baron_kills?: number | null
          dragon_kills?: number | null
          first_baron?: boolean | null
          first_blood?: boolean | null
          first_tower?: boolean | null
          inhibitor_kills?: number | null
          match_id?: number
          rift_herald_kills?: number | null
          team_id?: number
          tower_kills?: number | null
          win?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "teams_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["match_id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      compute_op_scores_for_match: {
        Args: { p_match_id: number }
        Returns: undefined
      }
      compute_player_streaks: {
        Args: { p_puuid: string }
        Returns: {
          best_streak: number
          lose_streak: number
          win_streak: number
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const

