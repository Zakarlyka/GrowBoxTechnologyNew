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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      articles: {
        Row: {
          category: string
          content: string
          created_at: string | null
          id: number
          image_url: string | null
          is_published: boolean | null
          title: string
          user_id: string | null
        }
        Insert: {
          category: string
          content: string
          created_at?: string | null
          id?: number
          image_url?: string | null
          is_published?: boolean | null
          title: string
          user_id?: string | null
        }
        Update: {
          category?: string
          content?: string
          created_at?: string | null
          id?: number
          image_url?: string | null
          is_published?: boolean | null
          title?: string
          user_id?: string | null
        }
        Relationships: []
      }
      custom_strains: {
        Row: {
          created_at: string | null
          id: string
          name: string
          notes: string | null
          start_date: string | null
          type: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          notes?: string | null
          start_date?: string | null
          type?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          notes?: string | null
          start_date?: string | null
          type?: string | null
          user_id?: string
        }
        Relationships: []
      }
      device_controls: {
        Row: {
          control_name: string
          control_type: string
          created_at: string
          device_id: string
          id: string
          intensity: number | null
          schedule: Json | null
          updated_at: string
          user_id: string | null
          value: boolean | null
        }
        Insert: {
          control_name: string
          control_type: string
          created_at?: string
          device_id: string
          id?: string
          intensity?: number | null
          schedule?: Json | null
          updated_at?: string
          user_id?: string | null
          value?: boolean | null
        }
        Update: {
          control_name?: string
          control_type?: string
          created_at?: string
          device_id?: string
          id?: string
          intensity?: number | null
          schedule?: Json | null
          updated_at?: string
          user_id?: string | null
          value?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "device_controls_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "devices"
            referencedColumns: ["id"]
          },
        ]
      }
      device_group_members: {
        Row: {
          added_at: string | null
          device_id: string
          group_id: string
        }
        Insert: {
          added_at?: string | null
          device_id: string
          group_id: string
        }
        Update: {
          added_at?: string | null
          device_id?: string
          group_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "device_group_members_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "devices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "device_group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "device_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      device_groups: {
        Row: {
          color: string | null
          created_at: string | null
          description: string | null
          id: string
          name: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      device_logs: {
        Row: {
          created_at: string | null
          device_id: string
          device_id_uuid: string | null
          hum: number | null
          id: string
          irrigation_time: string | null
          light_cycle_hours: number | null
          light_level: number | null
          metric: string | null
          soil_moisture: number | null
          temp: number | null
          user_id: string | null
          value: number | null
        }
        Insert: {
          created_at?: string | null
          device_id: string
          device_id_uuid?: string | null
          hum?: number | null
          id?: string
          irrigation_time?: string | null
          light_cycle_hours?: number | null
          light_level?: number | null
          metric?: string | null
          soil_moisture?: number | null
          temp?: number | null
          user_id?: string | null
          value?: number | null
        }
        Update: {
          created_at?: string | null
          device_id?: string
          device_id_uuid?: string | null
          hum?: number | null
          id?: string
          irrigation_time?: string | null
          light_cycle_hours?: number | null
          light_level?: number | null
          metric?: string | null
          soil_moisture?: number | null
          temp?: number | null
          user_id?: string | null
          value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "device_logs_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "devices"
            referencedColumns: ["device_id"]
          },
          {
            foreignKeyName: "fk_device_logs_device_id_uuid"
            columns: ["device_id_uuid"]
            isOneToOne: false
            referencedRelation: "devices"
            referencedColumns: ["id"]
          },
        ]
      }
      device_pairing_temp: {
        Row: {
          created_at: string | null
          device_id: string
          pairing_code: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          device_id: string
          pairing_code: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          device_id?: string
          pairing_code?: string
          user_id?: string | null
        }
        Relationships: []
      }
      device_schedules: {
        Row: {
          control_name: string
          created_at: string | null
          days_of_week: number[] | null
          device_id: string
          end_time: string | null
          id: string
          interval_minutes: number | null
          is_active: boolean | null
          schedule_type: string
          start_time: string | null
          updated_at: string | null
        }
        Insert: {
          control_name: string
          created_at?: string | null
          days_of_week?: number[] | null
          device_id: string
          end_time?: string | null
          id?: string
          interval_minutes?: number | null
          is_active?: boolean | null
          schedule_type: string
          start_time?: string | null
          updated_at?: string | null
        }
        Update: {
          control_name?: string
          created_at?: string | null
          days_of_week?: number[] | null
          device_id?: string
          end_time?: string | null
          id?: string
          interval_minutes?: number | null
          is_active?: boolean | null
          schedule_type?: string
          start_time?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "device_schedules_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "devices"
            referencedColumns: ["id"]
          },
        ]
      }
      devices: {
        Row: {
          created_at: string
          device_id: string
          group_id: string | null
          id: string
          last_activity: string | null
          last_hum: number | null
          last_seen: string | null
          last_seen_at: string | null
          last_soil_moisture: number | null
          last_temp: number | null
          location: string | null
          name: string
          settings: Json | null
          status: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          device_id: string
          group_id?: string | null
          id?: string
          last_activity?: string | null
          last_hum?: number | null
          last_seen?: string | null
          last_seen_at?: string | null
          last_soil_moisture?: number | null
          last_temp?: number | null
          location?: string | null
          name?: string
          settings?: Json | null
          status?: string
          type?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          device_id?: string
          group_id?: string | null
          id?: string
          last_activity?: string | null
          last_hum?: number | null
          last_seen?: string | null
          last_seen_at?: string | null
          last_soil_moisture?: number | null
          last_temp?: number | null
          location?: string | null
          name?: string
          settings?: Json | null
          status?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "devices_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "device_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      library_strains: {
        Row: {
          breeder: string | null
          created_at: string | null
          description: string | null
          difficulty: string | null
          flowering_days: number | null
          genetics: string | null
          genotype: string | null
          growing_params: Json | null
          id: number
          is_public: boolean | null
          name: string
          photo_url: string | null
          presets: Json | null
          thc_content: string | null
          thc_percent: number | null
          type: string | null
          user_id: string | null
          yield_indoor: string | null
        }
        Insert: {
          breeder?: string | null
          created_at?: string | null
          description?: string | null
          difficulty?: string | null
          flowering_days?: number | null
          genetics?: string | null
          genotype?: string | null
          growing_params?: Json | null
          id?: number
          is_public?: boolean | null
          name: string
          photo_url?: string | null
          presets?: Json | null
          thc_content?: string | null
          thc_percent?: number | null
          type?: string | null
          user_id?: string | null
          yield_indoor?: string | null
        }
        Update: {
          breeder?: string | null
          created_at?: string | null
          description?: string | null
          difficulty?: string | null
          flowering_days?: number | null
          genetics?: string | null
          genotype?: string | null
          growing_params?: Json | null
          id?: number
          is_public?: boolean | null
          name?: string
          photo_url?: string | null
          presets?: Json | null
          thc_content?: string | null
          thc_percent?: number | null
          type?: string | null
          user_id?: string | null
          yield_indoor?: string | null
        }
        Relationships: []
      }
      notification_settings: {
        Row: {
          created_at: string | null
          email_enabled: boolean | null
          humidity_max: number | null
          humidity_min: number | null
          id: string
          push_enabled: boolean | null
          temperature_max: number | null
          temperature_min: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          email_enabled?: boolean | null
          humidity_max?: number | null
          humidity_min?: number | null
          id?: string
          push_enabled?: boolean | null
          temperature_max?: number | null
          temperature_min?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          email_enabled?: boolean | null
          humidity_max?: number | null
          humidity_min?: number | null
          id?: string
          push_enabled?: boolean | null
          temperature_max?: number | null
          temperature_min?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          config: Json | null
          created_at: string | null
          device_id: string | null
          enabled: boolean | null
          id: string
          type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          config?: Json | null
          created_at?: string | null
          device_id?: string | null
          enabled?: boolean | null
          id?: string
          type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          config?: Json | null
          created_at?: string | null
          device_id?: string | null
          enabled?: boolean | null
          id?: string
          type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "devices"
            referencedColumns: ["id"]
          },
        ]
      }
      nutrient_schedules: {
        Row: {
          created_at: string | null
          description: string | null
          id: number
          name: string
          schedule_data: Json
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: number
          name: string
          schedule_data?: Json
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: number
          name?: string
          schedule_data?: Json
          user_id?: string | null
        }
        Relationships: []
      }
      pending_devices: {
        Row: {
          created_at: string | null
          device_token: string
          expires_at: string
          id: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          device_token: string
          expires_at: string
          id?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          device_token?: string
          expires_at?: string
          id?: string
          user_id?: string | null
        }
        Relationships: []
      }
      plans: {
        Row: {
          created_at: string | null
          features: Json | null
          id: string
          limits: Json | null
          name: string
          price_monthly: number | null
          slug: string
        }
        Insert: {
          created_at?: string | null
          features?: Json | null
          id?: string
          limits?: Json | null
          name: string
          price_monthly?: number | null
          slug: string
        }
        Update: {
          created_at?: string | null
          features?: Json | null
          id?: string
          limits?: Json | null
          name?: string
          price_monthly?: number | null
          slug?: string
        }
        Relationships: []
      }
      plants: {
        Row: {
          created_at: string | null
          current_stage: string | null
          custom_name: string | null
          device_id: string | null
          id: string
          is_main: boolean | null
          notes: string | null
          photo_url: string | null
          start_date: string | null
          strain_id: number | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          current_stage?: string | null
          custom_name?: string | null
          device_id?: string | null
          id?: string
          is_main?: boolean | null
          notes?: string | null
          photo_url?: string | null
          start_date?: string | null
          strain_id?: number | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          current_stage?: string | null
          custom_name?: string | null
          device_id?: string | null
          id?: string
          is_main?: boolean | null
          notes?: string | null
          photo_url?: string | null
          start_date?: string | null
          strain_id?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "plants_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "devices"
            referencedColumns: ["device_id"]
          },
          {
            foreignKeyName: "plants_strain_id_fkey"
            columns: ["strain_id"]
            isOneToOne: false
            referencedRelation: "library_strains"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          category: string | null
          created_at: string
          developer_id: string | null
          email: string
          full_name: string | null
          id: string
          is_ai_allowed: boolean
          phone: string | null
          units: Database["public"]["Enums"]["preferred_units"]
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          category?: string | null
          created_at?: string
          developer_id?: string | null
          email: string
          full_name?: string | null
          id?: string
          is_ai_allowed?: boolean
          phone?: string | null
          units?: Database["public"]["Enums"]["preferred_units"]
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          category?: string | null
          created_at?: string
          developer_id?: string | null
          email?: string
          full_name?: string | null
          id?: string
          is_ai_allowed?: boolean
          phone?: string | null
          units?: Database["public"]["Enums"]["preferred_units"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_developer_id_fkey"
            columns: ["developer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      schedules: {
        Row: {
          action: string
          created_at: string | null
          days_of_week: number[] | null
          device_id: string
          enabled: boolean | null
          end_time: string | null
          id: string
          name: string
          repeat: string
          start_time: string
          updated_at: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          days_of_week?: number[] | null
          device_id: string
          enabled?: boolean | null
          end_time?: string | null
          id?: string
          name: string
          repeat?: string
          start_time: string
          updated_at?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          days_of_week?: number[] | null
          device_id?: string
          enabled?: boolean | null
          end_time?: string | null
          id?: string
          name?: string
          repeat?: string
          start_time?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "schedules_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "devices"
            referencedColumns: ["id"]
          },
        ]
      }
      sensor_data: {
        Row: {
          device_id: string
          ec_level: number | null
          humidity: number | null
          id: string
          light_level: number | null
          ph_level: number | null
          soil_moisture: number | null
          temperature: number | null
          timestamp: string
          water_level: number | null
        }
        Insert: {
          device_id: string
          ec_level?: number | null
          humidity?: number | null
          id?: string
          light_level?: number | null
          ph_level?: number | null
          soil_moisture?: number | null
          temperature?: number | null
          timestamp?: string
          water_level?: number | null
        }
        Update: {
          device_id?: string
          ec_level?: number | null
          humidity?: number | null
          id?: string
          light_level?: number | null
          ph_level?: number | null
          soil_moisture?: number | null
          temperature?: number | null
          timestamp?: string
          water_level?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "sensor_data_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "devices"
            referencedColumns: ["id"]
          },
        ]
      }
      strains: {
        Row: {
          created_at: string | null
          description: string | null
          fertilizer_schedule: Json | null
          id: string
          name: string
          settings_by_phase: Json | null
          type: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          fertilizer_schedule?: Json | null
          id?: string
          name: string
          settings_by_phase?: Json | null
          type?: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          fertilizer_schedule?: Json | null
          id?: string
          name?: string
          settings_by_phase?: Json | null
          type?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          created_at: string | null
          current_period_end: string | null
          id: string
          plan_id: string
          status: Database["public"]["Enums"]["subscription_status"]
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          current_period_end?: string | null
          id?: string
          plan_id: string
          status?: Database["public"]["Enums"]["subscription_status"]
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          current_period_end?: string | null
          id?: string
          plan_id?: string
          status?: Database["public"]["Enums"]["subscription_status"]
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          app_role: Database["public"]["Enums"]["app_role"] | null
          created_at: string | null
          id: string
          user_id: string | null
        }
        Insert: {
          app_role?: Database["public"]["Enums"]["app_role"] | null
          created_at?: string | null
          id?: string
          user_id?: string | null
        }
        Update: {
          app_role?: Database["public"]["Enums"]["app_role"] | null
          created_at?: string | null
          id?: string
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_get_all_users: {
        Args: never
        Returns: {
          app_role: Database["public"]["Enums"]["app_role"]
          email: string
          full_name: string
          user_id: string
        }[]
      }
      check_and_zero_offline_devices: { Args: never; Returns: undefined }
      cleanup_old_pairing_records: { Args: never; Returns: undefined }
      get_device_settings: { Args: { device_uuid: string }; Returns: Json }
      get_my_role: {
        Args: never
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role:
        | { Args: { _role: string; _user: string }; Returns: boolean }
        | {
            Args: {
              _role: Database["public"]["Enums"]["app_role"]
              _user_id: string
            }
            Returns: boolean
          }
      is_admin: { Args: never; Returns: boolean }
      mark_devices_offline: { Args: never; Returns: undefined }
      secure_register_device: {
        Args: {
          p_device_id: string
          p_location?: string
          p_name: string
          p_type: string
        }
        Returns: {
          device_id: string
          id: string
          name: string
          type: string
          user_id: string
        }[]
      }
      verify_and_consume_pending_token: {
        Args: { p_token: string }
        Returns: {
          device_id: string
          user_id: string
        }[]
      }
    }
    Enums: {
      app_role: "user" | "admin" | "superadmin" | "developer"
      preferred_units: "metric" | "imperial"
      subscription_status:
        | "trialing"
        | "active"
        | "canceled"
        | "incomplete"
        | "past_due"
        | "unpaid"
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
      app_role: ["user", "admin", "superadmin", "developer"],
      preferred_units: ["metric", "imperial"],
      subscription_status: [
        "trialing",
        "active",
        "canceled",
        "incomplete",
        "past_due",
        "unpaid",
      ],
    },
  },
} as const
