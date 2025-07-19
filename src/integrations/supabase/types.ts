export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      ai_conversations: {
        Row: {
          conversation_type: string
          created_at: string
          id: string
          is_active: boolean
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          conversation_type: string
          created_at?: string
          id?: string
          is_active?: boolean
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          conversation_type?: string
          created_at?: string
          id?: string
          is_active?: boolean
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      ai_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          metadata: Json | null
          role: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          metadata?: Json | null
          role: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "ai_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      body_measurements: {
        Row: {
          assessment_id: string | null
          bicep_left: number | null
          bicep_right: number | null
          chest: number | null
          hip: number | null
          id: string
          measured_at: string
          thigh_left: number | null
          thigh_right: number | null
          user_id: string
          waist: number | null
        }
        Insert: {
          assessment_id?: string | null
          bicep_left?: number | null
          bicep_right?: number | null
          chest?: number | null
          hip?: number | null
          id?: string
          measured_at?: string
          thigh_left?: number | null
          thigh_right?: number | null
          user_id: string
          waist?: number | null
        }
        Update: {
          assessment_id?: string | null
          bicep_left?: number | null
          bicep_right?: number | null
          chest?: number | null
          hip?: number | null
          id?: string
          measured_at?: string
          thigh_left?: number | null
          thigh_right?: number | null
          user_id?: string
          waist?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "body_measurements_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "physical_assessments"
            referencedColumns: ["id"]
          },
        ]
      }
      diet_plans: {
        Row: {
          ai_prompt: string | null
          created_at: string
          daily_calories: number | null
          daily_carbs: number | null
          daily_fat: number | null
          daily_protein: number | null
          description: string | null
          end_date: string | null
          generated_by_ai: boolean
          id: string
          instructor_id: string | null
          is_active: boolean
          name: string
          start_date: string
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_prompt?: string | null
          created_at?: string
          daily_calories?: number | null
          daily_carbs?: number | null
          daily_fat?: number | null
          daily_protein?: number | null
          description?: string | null
          end_date?: string | null
          generated_by_ai?: boolean
          id?: string
          instructor_id?: string | null
          is_active?: boolean
          name: string
          start_date: string
          updated_at?: string
          user_id: string
        }
        Update: {
          ai_prompt?: string | null
          created_at?: string
          daily_calories?: number | null
          daily_carbs?: number | null
          daily_fat?: number | null
          daily_protein?: number | null
          description?: string | null
          end_date?: string | null
          generated_by_ai?: boolean
          id?: string
          instructor_id?: string | null
          is_active?: boolean
          name?: string
          start_date?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      exercises: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          equipment: string[] | null
          exercise_type: Database["public"]["Enums"]["exercise_type"]
          id: string
          instructions: string | null
          is_public: boolean
          muscle_groups: string[]
          name: string
          video_url: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          equipment?: string[] | null
          exercise_type: Database["public"]["Enums"]["exercise_type"]
          id?: string
          instructions?: string | null
          is_public?: boolean
          muscle_groups?: string[]
          name: string
          video_url?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          equipment?: string[] | null
          exercise_type?: Database["public"]["Enums"]["exercise_type"]
          id?: string
          instructions?: string | null
          is_public?: boolean
          muscle_groups?: string[]
          name?: string
          video_url?: string | null
        }
        Relationships: []
      }
      gym_members: {
        Row: {
          gym_id: string
          id: string
          instructor_id: string | null
          is_active: boolean
          joined_at: string
          user_id: string
        }
        Insert: {
          gym_id: string
          id?: string
          instructor_id?: string | null
          is_active?: boolean
          joined_at?: string
          user_id: string
        }
        Update: {
          gym_id?: string
          id?: string
          instructor_id?: string | null
          is_active?: boolean
          joined_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "gym_members_gym_id_fkey"
            columns: ["gym_id"]
            isOneToOne: false
            referencedRelation: "gyms"
            referencedColumns: ["id"]
          },
        ]
      }
      gyms: {
        Row: {
          address: string | null
          created_at: string
          email: string | null
          id: string
          name: string
          owner_id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name: string
          owner_id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          owner_id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      instructor_students: {
        Row: {
          created_at: string
          id: string
          instructor_id: string
          is_active: boolean
          student_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          instructor_id: string
          is_active?: boolean
          student_id: string
        }
        Update: {
          created_at?: string
          id?: string
          instructor_id?: string
          is_active?: boolean
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "instructor_students_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "instructor_students_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      meals: {
        Row: {
          calories: number | null
          carbs: number | null
          category: Database["public"]["Enums"]["meal_category"]
          created_at: string
          description: string | null
          diet_plan_id: string
          fat: number | null
          id: string
          ingredients: Json
          instructions: string | null
          name: string
          preparation_time: number | null
          protein: number | null
        }
        Insert: {
          calories?: number | null
          carbs?: number | null
          category: Database["public"]["Enums"]["meal_category"]
          created_at?: string
          description?: string | null
          diet_plan_id: string
          fat?: number | null
          id?: string
          ingredients?: Json
          instructions?: string | null
          name: string
          preparation_time?: number | null
          protein?: number | null
        }
        Update: {
          calories?: number | null
          carbs?: number | null
          category?: Database["public"]["Enums"]["meal_category"]
          created_at?: string
          description?: string | null
          diet_plan_id?: string
          fat?: number | null
          id?: string
          ingredients?: Json
          instructions?: string | null
          name?: string
          preparation_time?: number | null
          protein?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "meals_diet_plan_id_fkey"
            columns: ["diet_plan_id"]
            isOneToOne: false
            referencedRelation: "diet_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      nutrition_goals: {
        Row: {
          created_at: string
          goal_type: string
          id: string
          is_active: boolean
          target_body_fat: number | null
          target_weight: number | null
          updated_at: string
          user_id: string
          weekly_goal: number | null
        }
        Insert: {
          created_at?: string
          goal_type: string
          id?: string
          is_active?: boolean
          target_body_fat?: number | null
          target_weight?: number | null
          updated_at?: string
          user_id: string
          weekly_goal?: number | null
        }
        Update: {
          created_at?: string
          goal_type?: string
          id?: string
          is_active?: boolean
          target_body_fat?: number | null
          target_weight?: number | null
          updated_at?: string
          user_id?: string
          weekly_goal?: number | null
        }
        Relationships: []
      }
      physical_assessments: {
        Row: {
          assessment_date: string
          bmi: number | null
          body_fat_percentage: number | null
          created_at: string
          height: number | null
          id: string
          instructor_id: string | null
          muscle_mass: number | null
          notes: string | null
          user_id: string
          weight: number | null
        }
        Insert: {
          assessment_date?: string
          bmi?: number | null
          body_fat_percentage?: number | null
          created_at?: string
          height?: number | null
          id?: string
          instructor_id?: string | null
          muscle_mass?: number | null
          notes?: string | null
          user_id: string
          weight?: number | null
        }
        Update: {
          assessment_date?: string
          bmi?: number | null
          body_fat_percentage?: number | null
          created_at?: string
          height?: number | null
          id?: string
          instructor_id?: string | null
          muscle_mass?: number | null
          notes?: string | null
          user_id?: string
          weight?: number | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          date_of_birth: string | null
          email: string
          full_name: string
          gender: string | null
          id: string
          phone: string | null
          profile_picture_url: string | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          date_of_birth?: string | null
          email: string
          full_name: string
          gender?: string | null
          id?: string
          phone?: string | null
          profile_picture_url?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          date_of_birth?: string | null
          email?: string
          full_name?: string
          gender?: string | null
          id?: string
          phone?: string | null
          profile_picture_url?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      progress_photos: {
        Row: {
          created_at: string
          description: string | null
          id: string
          photo_type: string | null
          photo_url: string
          taken_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          photo_type?: string | null
          photo_url: string
          taken_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          photo_type?: string | null
          photo_url?: string
          taken_at?: string
          user_id?: string
        }
        Relationships: []
      }
      subscription_plans: {
        Row: {
          ai_requests_limit: number
          created_at: string
          features: Json
          id: string
          is_active: boolean
          name: string
          price: number
          type: Database["public"]["Enums"]["subscription_plan_type"]
          updated_at: string
        }
        Insert: {
          ai_requests_limit?: number
          created_at?: string
          features?: Json
          id?: string
          is_active?: boolean
          name: string
          price?: number
          type: Database["public"]["Enums"]["subscription_plan_type"]
          updated_at?: string
        }
        Update: {
          ai_requests_limit?: number
          created_at?: string
          features?: Json
          id?: string
          is_active?: boolean
          name?: string
          price?: number
          type?: Database["public"]["Enums"]["subscription_plan_type"]
          updated_at?: string
        }
        Relationships: []
      }
      user_subscriptions: {
        Row: {
          ai_requests_used: number
          created_at: string
          expires_at: string | null
          id: string
          plan_id: string
          started_at: string
          status: Database["public"]["Enums"]["subscription_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_requests_used?: number
          created_at?: string
          expires_at?: string | null
          id?: string
          plan_id: string
          started_at?: string
          status?: Database["public"]["Enums"]["subscription_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          ai_requests_used?: number
          created_at?: string
          expires_at?: string | null
          id?: string
          plan_id?: string
          started_at?: string
          status?: Database["public"]["Enums"]["subscription_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      weight_history: {
        Row: {
          body_fat_percentage: number | null
          created_at: string
          id: string
          muscle_mass: number | null
          notes: string | null
          recorded_at: string
          user_id: string
          weight: number
        }
        Insert: {
          body_fat_percentage?: number | null
          created_at?: string
          id?: string
          muscle_mass?: number | null
          notes?: string | null
          recorded_at?: string
          user_id: string
          weight: number
        }
        Update: {
          body_fat_percentage?: number | null
          created_at?: string
          id?: string
          muscle_mass?: number | null
          notes?: string | null
          recorded_at?: string
          user_id?: string
          weight?: number
        }
        Relationships: []
      }
      workout_plans: {
        Row: {
          ai_prompt: string | null
          created_at: string
          description: string | null
          end_date: string | null
          exercises: Json
          generated_by_ai: boolean
          id: string
          instructor_id: string | null
          is_active: boolean
          name: string
          start_date: string
          template_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_prompt?: string | null
          created_at?: string
          description?: string | null
          end_date?: string | null
          exercises?: Json
          generated_by_ai?: boolean
          id?: string
          instructor_id?: string | null
          is_active?: boolean
          name: string
          start_date: string
          template_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          ai_prompt?: string | null
          created_at?: string
          description?: string | null
          end_date?: string | null
          exercises?: Json
          generated_by_ai?: boolean
          id?: string
          instructor_id?: string | null
          is_active?: boolean
          name?: string
          start_date?: string
          template_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workout_plans_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "workout_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_templates: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          difficulty_level: number | null
          estimated_duration: number | null
          id: string
          is_public: boolean
          name: string
          target_muscle_groups: string[]
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          difficulty_level?: number | null
          estimated_duration?: number | null
          id?: string
          is_public?: boolean
          name: string
          target_muscle_groups?: string[]
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          difficulty_level?: number | null
          estimated_duration?: number | null
          id?: string
          is_public?: boolean
          name?: string
          target_muscle_groups?: string[]
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_bmi: {
        Args: { weight: number; height: number }
        Returns: number
      }
      get_user_role: {
        Args: { user_uuid: string }
        Returns: Database["public"]["Enums"]["user_role"]
      }
      is_instructor: {
        Args: { user_uuid: string }
        Returns: boolean
      }
    }
    Enums: {
      exercise_type:
        | "strength"
        | "cardio"
        | "flexibility"
        | "balance"
        | "sports"
      meal_category: "breakfast" | "lunch" | "dinner" | "snack"
      subscription_plan_type: "free" | "premium" | "enterprise"
      subscription_status: "active" | "inactive" | "canceled" | "trial"
      user_role: "admin" | "instructor" | "student"
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
    Enums: {
      exercise_type: ["strength", "cardio", "flexibility", "balance", "sports"],
      meal_category: ["breakfast", "lunch", "dinner", "snack"],
      subscription_plan_type: ["free", "premium", "enterprise"],
      subscription_status: ["active", "inactive", "canceled", "trial"],
      user_role: ["admin", "instructor", "student"],
    },
  },
} as const
