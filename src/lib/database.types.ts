export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      ai_daily_targets: {
        Row: {
          added_sugar_g: number | null
          calorie_max: number | null
          calorie_min: number | null
          created_at: string | null
          cycle_phase: string | null
          fiber_g: number | null
          generated_at: string
          gl_target: number | null
          id: string
          insulin_score: number | null
          insulin_score_basis: Json | null
          narrative: string | null
          pc_ratio_target: number | null
          prompt_version: number | null
          protein_g: number | null
          user_id: string
        }
        Insert: {
          added_sugar_g?: number | null
          calorie_max?: number | null
          calorie_min?: number | null
          created_at?: string | null
          cycle_phase?: string | null
          fiber_g?: number | null
          generated_at?: string
          gl_target?: number | null
          id?: string
          insulin_score?: number | null
          insulin_score_basis?: Json | null
          narrative?: string | null
          pc_ratio_target?: number | null
          prompt_version?: number | null
          protein_g?: number | null
          user_id: string
        }
        Update: {
          added_sugar_g?: number | null
          calorie_max?: number | null
          calorie_min?: number | null
          created_at?: string | null
          cycle_phase?: string | null
          fiber_g?: number | null
          generated_at?: string
          gl_target?: number | null
          id?: string
          insulin_score?: number | null
          insulin_score_basis?: Json | null
          narrative?: string | null
          pc_ratio_target?: number | null
          prompt_version?: number | null
          protein_g?: number | null
          user_id?: string
        }
        Relationships: []
      }
      food_logs: {
        Row: {
          carbs_g: number | null
          created_at: string | null
          fat_g: number | null
          fdc_id: string | null
          fiber_g: number | null
          food_name: string
          gi: number | null
          gl: number | null
          id: string
          kcal: number | null
          logged_at: string
          meal_slot: string
          protein_g: number | null
          serving_g: number
          sugar_g: number | null
          user_id: string
        }
        Insert: {
          carbs_g?: number | null
          created_at?: string | null
          fat_g?: number | null
          fdc_id?: string | null
          fiber_g?: number | null
          food_name: string
          gi?: number | null
          gl?: number | null
          id?: string
          kcal?: number | null
          logged_at?: string
          meal_slot: string
          protein_g?: number | null
          serving_g: number
          sugar_g?: number | null
          user_id: string
        }
        Update: {
          carbs_g?: number | null
          created_at?: string | null
          fat_g?: number | null
          fdc_id?: string | null
          fiber_g?: number | null
          food_name?: string
          gi?: number | null
          gl?: number | null
          id?: string
          kcal?: number | null
          logged_at?: string
          meal_slot?: string
          protein_g?: number | null
          serving_g?: number
          sugar_g?: number | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          age: number | null
          created_at: string | null
          current_weight_kg: number | null
          cycle_length_days: number | null
          dark_mode: boolean | null
          display_name: string | null
          goal_weight_kg: number | null
          goals: string[] | null
          height_cm: number | null
          id: string
          last_period_date: string | null
          palette: string | null
          pcos_type: string | null
          period_length_days: number | null
          updated_at: string | null
        }
        Insert: {
          age?: number | null
          created_at?: string | null
          current_weight_kg?: number | null
          cycle_length_days?: number | null
          dark_mode?: boolean | null
          display_name?: string | null
          goal_weight_kg?: number | null
          goals?: string[] | null
          height_cm?: number | null
          id: string
          last_period_date?: string | null
          palette?: string | null
          pcos_type?: string | null
          period_length_days?: number | null
          updated_at?: string | null
        }
        Update: {
          age?: number | null
          created_at?: string | null
          current_weight_kg?: number | null
          cycle_length_days?: number | null
          dark_mode?: boolean | null
          display_name?: string | null
          goal_weight_kg?: number | null
          goals?: string[] | null
          height_cm?: number | null
          id?: string
          last_period_date?: string | null
          palette?: string | null
          pcos_type?: string | null
          period_length_days?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      recipe_suggestions: {
        Row: {
          generated_at: string
          id: string
          recipes: Json
          user_id: string
        }
        Insert: {
          generated_at?: string
          id?: string
          recipes?: Json
          user_id: string
        }
        Update: {
          generated_at?: string
          id?: string
          recipes?: Json
          user_id?: string
        }
        Relationships: []
      }
      symptom_logs: {
        Row: {
          bloating: number | null
          cravings: number | null
          created_at: string | null
          energy: number | null
          id: string
          log_date: string
          logged_at: string
          mood: number | null
          skin: number | null
          sleep: number | null
          user_id: string
        }
        Insert: {
          bloating?: number | null
          cravings?: number | null
          created_at?: string | null
          energy?: number | null
          id?: string
          log_date?: string
          logged_at?: string
          mood?: number | null
          skin?: number | null
          sleep?: number | null
          user_id: string
        }
        Update: {
          bloating?: number | null
          cravings?: number | null
          created_at?: string | null
          energy?: number | null
          id?: string
          log_date?: string
          logged_at?: string
          mood?: number | null
          skin?: number | null
          sleep?: number | null
          user_id?: string
        }
        Relationships: []
      }
      usda_foods: {
        Row: {
          brand_owner: string | null
          carbs_g_per_100g: number | null
          data_type: string | null
          description: string
          expires_at: string | null
          fat_g_per_100g: number | null
          fdc_id: string
          fetched_at: string | null
          fiber_g_per_100g: number | null
          gtin_upc: string | null
          kcal_per_100g: number | null
          protein_g_per_100g: number | null
          raw_nutrients: Json | null
          sugar_g_per_100g: number | null
        }
        Insert: {
          brand_owner?: string | null
          carbs_g_per_100g?: number | null
          data_type?: string | null
          description: string
          expires_at?: string | null
          fat_g_per_100g?: number | null
          fdc_id: string
          fetched_at?: string | null
          fiber_g_per_100g?: number | null
          gtin_upc?: string | null
          kcal_per_100g?: number | null
          protein_g_per_100g?: number | null
          raw_nutrients?: Json | null
          sugar_g_per_100g?: number | null
        }
        Update: {
          brand_owner?: string | null
          carbs_g_per_100g?: number | null
          data_type?: string | null
          description?: string
          expires_at?: string | null
          fat_g_per_100g?: number | null
          fdc_id?: string
          fetched_at?: string | null
          fiber_g_per_100g?: number | null
          gtin_upc?: string | null
          kcal_per_100g?: number | null
          protein_g_per_100g?: number | null
          raw_nutrients?: Json | null
          sugar_g_per_100g?: number | null
        }
        Relationships: []
      }
      weight_logs: {
        Row: {
          created_at: string | null
          id: string
          log_date: string
          logged_at: string
          user_id: string
          weight_kg: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          log_date?: string
          logged_at?: string
          user_id: string
          weight_kg: number
        }
        Update: {
          created_at?: string | null
          id?: string
          log_date?: string
          logged_at?: string
          user_id?: string
          weight_kg?: number
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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
A new version of Supabase CLI is available: v2.100.1 (currently installed v)
We recommend updating regularly for new features and bug fixes: https://supabase.com/docs/guides/cli/getting-started#updating-the-supabase-cli
