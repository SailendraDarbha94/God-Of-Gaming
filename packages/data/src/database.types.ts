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
      areas: {
        Row: {
          city_id: string
          created_at: string
          id: string
          lat: number
          lng: number
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          city_id: string
          created_at?: string
          id?: string
          lat: number
          lng: number
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          city_id?: string
          created_at?: string
          id?: string
          lat?: number
          lng?: number
          name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "areas_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
        ]
      }
      booking_seats: {
        Row: {
          booking_id: string
          created_at: string
          during: unknown
          id: string
          released_at: string | null
          station_id: string
          station_label: string
        }
        Insert: {
          booking_id: string
          created_at?: string
          during: unknown
          id?: string
          released_at?: string | null
          station_id: string
          station_label: string
        }
        Update: {
          booking_id?: string
          created_at?: string
          during?: unknown
          id?: string
          released_at?: string | null
          station_id?: string
          station_label?: string
        }
        Relationships: [
          {
            foreignKeyName: "booking_seats_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "booking_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_seats_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_seats_station_id_fkey"
            columns: ["station_id"]
            isOneToOne: false
            referencedRelation: "stations"
            referencedColumns: ["id"]
          },
        ]
      }
      bookings: {
        Row: {
          cafe_id: string
          cafe_name: string
          cafe_slug: string
          created_at: string
          ends_at: string
          hold_expires_at: string | null
          hourly_rate_paise: number
          id: string
          lock_fee_paise: number
          seat_count: number
          source: Database["public"]["Enums"]["booking_source"]
          starts_at: string
          status: Database["public"]["Enums"]["booking_status"]
          tier_id: string
          tier_kind: Database["public"]["Enums"]["station_kind"]
          tier_name: string
          total_paise: number
          updated_at: string
          user_id: string
        }
        Insert: {
          cafe_id: string
          cafe_name: string
          cafe_slug: string
          created_at?: string
          ends_at: string
          hold_expires_at?: string | null
          hourly_rate_paise: number
          id?: string
          lock_fee_paise?: number
          seat_count: number
          source?: Database["public"]["Enums"]["booking_source"]
          starts_at: string
          status?: Database["public"]["Enums"]["booking_status"]
          tier_id: string
          tier_kind: Database["public"]["Enums"]["station_kind"]
          tier_name: string
          total_paise: number
          updated_at?: string
          user_id: string
        }
        Update: {
          cafe_id?: string
          cafe_name?: string
          cafe_slug?: string
          created_at?: string
          ends_at?: string
          hold_expires_at?: string | null
          hourly_rate_paise?: number
          id?: string
          lock_fee_paise?: number
          seat_count?: number
          source?: Database["public"]["Enums"]["booking_source"]
          starts_at?: string
          status?: Database["public"]["Enums"]["booking_status"]
          tier_id?: string
          tier_kind?: Database["public"]["Enums"]["station_kind"]
          tier_name?: string
          total_paise?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_cafe_id_fkey"
            columns: ["cafe_id"]
            isOneToOne: false
            referencedRelation: "cafe_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_cafe_id_fkey"
            columns: ["cafe_id"]
            isOneToOne: false
            referencedRelation: "cafes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_tier_id_fkey"
            columns: ["tier_id"]
            isOneToOne: false
            referencedRelation: "station_tiers"
            referencedColumns: ["id"]
          },
        ]
      }
      cafe_games: {
        Row: {
          cafe_id: string
          game_id: string
        }
        Insert: {
          cafe_id: string
          game_id: string
        }
        Update: {
          cafe_id?: string
          game_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cafe_games_cafe_id_fkey"
            columns: ["cafe_id"]
            isOneToOne: false
            referencedRelation: "cafe_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cafe_games_cafe_id_fkey"
            columns: ["cafe_id"]
            isOneToOne: false
            referencedRelation: "cafes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cafe_games_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
        ]
      }
      cafe_hours: {
        Row: {
          cafe_id: string
          closes_at: string
          id: string
          is_overnight: boolean
          opens_at: string
          weekday: number
        }
        Insert: {
          cafe_id: string
          closes_at: string
          id?: string
          is_overnight?: boolean
          opens_at: string
          weekday: number
        }
        Update: {
          cafe_id?: string
          closes_at?: string
          id?: string
          is_overnight?: boolean
          opens_at?: string
          weekday?: number
        }
        Relationships: [
          {
            foreignKeyName: "cafe_hours_cafe_id_fkey"
            columns: ["cafe_id"]
            isOneToOne: false
            referencedRelation: "cafe_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cafe_hours_cafe_id_fkey"
            columns: ["cafe_id"]
            isOneToOne: false
            referencedRelation: "cafes"
            referencedColumns: ["id"]
          },
        ]
      }
      cafe_images: {
        Row: {
          alt: string
          cafe_id: string
          id: string
          sort_order: number
          url: string
        }
        Insert: {
          alt?: string
          cafe_id: string
          id?: string
          sort_order?: number
          url: string
        }
        Update: {
          alt?: string
          cafe_id?: string
          id?: string
          sort_order?: number
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "cafe_images_cafe_id_fkey"
            columns: ["cafe_id"]
            isOneToOne: false
            referencedRelation: "cafe_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cafe_images_cafe_id_fkey"
            columns: ["cafe_id"]
            isOneToOne: false
            referencedRelation: "cafes"
            referencedColumns: ["id"]
          },
        ]
      }
      cafe_members: {
        Row: {
          cafe_id: string
          created_at: string
          role: Database["public"]["Enums"]["cafe_member_role"]
          user_id: string
        }
        Insert: {
          cafe_id: string
          created_at?: string
          role: Database["public"]["Enums"]["cafe_member_role"]
          user_id: string
        }
        Update: {
          cafe_id?: string
          created_at?: string
          role?: Database["public"]["Enums"]["cafe_member_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cafe_members_cafe_id_fkey"
            columns: ["cafe_id"]
            isOneToOne: false
            referencedRelation: "cafe_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cafe_members_cafe_id_fkey"
            columns: ["cafe_id"]
            isOneToOne: false
            referencedRelation: "cafes"
            referencedColumns: ["id"]
          },
        ]
      }
      cafes: {
        Row: {
          address_line: string
          amenities: string[]
          area_id: string
          created_at: string
          description: string
          id: string
          lat: number
          lng: number
          maps_url: string | null
          name: string
          slug: string
          status: Database["public"]["Enums"]["cafe_status"]
          updated_at: string
          whatsapp: string | null
        }
        Insert: {
          address_line: string
          amenities?: string[]
          area_id: string
          created_at?: string
          description?: string
          id?: string
          lat: number
          lng: number
          maps_url?: string | null
          name: string
          slug: string
          status?: Database["public"]["Enums"]["cafe_status"]
          updated_at?: string
          whatsapp?: string | null
        }
        Update: {
          address_line?: string
          amenities?: string[]
          area_id?: string
          created_at?: string
          description?: string
          id?: string
          lat?: number
          lng?: number
          maps_url?: string | null
          name?: string
          slug?: string
          status?: Database["public"]["Enums"]["cafe_status"]
          updated_at?: string
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cafes_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "areas"
            referencedColumns: ["id"]
          },
        ]
      }
      cities: {
        Row: {
          created_at: string
          id: string
          is_live: boolean
          lat: number | null
          lng: number | null
          name: string
          slug: string
          state: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_live?: boolean
          lat?: number | null
          lng?: number | null
          name: string
          slug: string
          state: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_live?: boolean
          lat?: number | null
          lng?: number | null
          name?: string
          slug?: string
          state?: string
          updated_at?: string
        }
        Relationships: []
      }
      games: {
        Row: {
          id: string
          kinds: Database["public"]["Enums"]["station_kind"][]
          name: string
          slug: string
        }
        Insert: {
          id?: string
          kinds?: Database["public"]["Enums"]["station_kind"][]
          name: string
          slug: string
        }
        Update: {
          id?: string
          kinds?: Database["public"]["Enums"]["station_kind"][]
          name?: string
          slug?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          home_city_id: string | null
          id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          home_city_id?: string | null
          id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          home_city_id?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_home_city_id_fkey"
            columns: ["home_city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
        ]
      }
      promotions: {
        Row: {
          body: string
          cafe_id: string | null
          city_id: string | null
          created_at: string
          cta_label: string | null
          cta_url: string | null
          ends_at: string | null
          id: string
          image_url: string | null
          is_featured: boolean
          is_published: boolean
          slug: string
          starts_at: string
          summary: string
          title: string
          updated_at: string
        }
        Insert: {
          body?: string
          cafe_id?: string | null
          city_id?: string | null
          created_at?: string
          cta_label?: string | null
          cta_url?: string | null
          ends_at?: string | null
          id?: string
          image_url?: string | null
          is_featured?: boolean
          is_published?: boolean
          slug: string
          starts_at: string
          summary: string
          title: string
          updated_at?: string
        }
        Update: {
          body?: string
          cafe_id?: string | null
          city_id?: string | null
          created_at?: string
          cta_label?: string | null
          cta_url?: string | null
          ends_at?: string | null
          id?: string
          image_url?: string | null
          is_featured?: boolean
          is_published?: boolean
          slug?: string
          starts_at?: string
          summary?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "promotions_cafe_id_fkey"
            columns: ["cafe_id"]
            isOneToOne: false
            referencedRelation: "cafe_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promotions_cafe_id_fkey"
            columns: ["cafe_id"]
            isOneToOne: false
            referencedRelation: "cafes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promotions_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
        ]
      }
      station_tiers: {
        Row: {
          cafe_id: string
          created_at: string
          description: string | null
          hourly_rate_paise: number
          id: string
          kind: Database["public"]["Enums"]["station_kind"]
          name: string
          sort_order: number
          specs: Json
          updated_at: string
        }
        Insert: {
          cafe_id: string
          created_at?: string
          description?: string | null
          hourly_rate_paise: number
          id?: string
          kind: Database["public"]["Enums"]["station_kind"]
          name: string
          sort_order?: number
          specs?: Json
          updated_at?: string
        }
        Update: {
          cafe_id?: string
          created_at?: string
          description?: string | null
          hourly_rate_paise?: number
          id?: string
          kind?: Database["public"]["Enums"]["station_kind"]
          name?: string
          sort_order?: number
          specs?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "station_tiers_cafe_id_fkey"
            columns: ["cafe_id"]
            isOneToOne: false
            referencedRelation: "cafe_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "station_tiers_cafe_id_fkey"
            columns: ["cafe_id"]
            isOneToOne: false
            referencedRelation: "cafes"
            referencedColumns: ["id"]
          },
        ]
      }
      stations: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          label: string
          tier_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          label: string
          tier_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          label?: string
          tier_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "stations_tier_id_fkey"
            columns: ["tier_id"]
            isOneToOne: false
            referencedRelation: "station_tiers"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      booking_details: {
        Row: {
          cafe_id: string | null
          cafe_name: string | null
          cafe_slug: string | null
          created_at: string | null
          ends_at: string | null
          hold_expires_at: string | null
          hourly_rate_paise: number | null
          id: string | null
          lock_fee_paise: number | null
          seat_count: number | null
          seats: Json | null
          source: Database["public"]["Enums"]["booking_source"] | null
          starts_at: string | null
          status: Database["public"]["Enums"]["booking_status"] | null
          tier_id: string | null
          tier_kind: Database["public"]["Enums"]["station_kind"] | null
          tier_name: string | null
          total_paise: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          cafe_id?: string | null
          cafe_name?: string | null
          cafe_slug?: string | null
          created_at?: string | null
          ends_at?: string | null
          hold_expires_at?: string | null
          hourly_rate_paise?: number | null
          id?: string | null
          lock_fee_paise?: number | null
          seat_count?: number | null
          seats?: never
          source?: Database["public"]["Enums"]["booking_source"] | null
          starts_at?: string | null
          status?: Database["public"]["Enums"]["booking_status"] | null
          tier_id?: string | null
          tier_kind?: Database["public"]["Enums"]["station_kind"] | null
          tier_name?: string | null
          total_paise?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          cafe_id?: string | null
          cafe_name?: string | null
          cafe_slug?: string | null
          created_at?: string | null
          ends_at?: string | null
          hold_expires_at?: string | null
          hourly_rate_paise?: number | null
          id?: string | null
          lock_fee_paise?: number | null
          seat_count?: number | null
          seats?: never
          source?: Database["public"]["Enums"]["booking_source"] | null
          starts_at?: string | null
          status?: Database["public"]["Enums"]["booking_status"] | null
          tier_id?: string | null
          tier_kind?: Database["public"]["Enums"]["station_kind"] | null
          tier_name?: string | null
          total_paise?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bookings_cafe_id_fkey"
            columns: ["cafe_id"]
            isOneToOne: false
            referencedRelation: "cafe_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_cafe_id_fkey"
            columns: ["cafe_id"]
            isOneToOne: false
            referencedRelation: "cafes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_tier_id_fkey"
            columns: ["tier_id"]
            isOneToOne: false
            referencedRelation: "station_tiers"
            referencedColumns: ["id"]
          },
        ]
      }
      cafe_cards: {
        Row: {
          area_name: string | null
          area_slug: string | null
          city_name: string | null
          city_slug: string | null
          cover_image_url: string | null
          from_hourly_rate_paise: number | null
          id: string | null
          kinds: Database["public"]["Enums"]["station_kind"][] | null
          name: string | null
          slug: string | null
          station_count: number | null
          status: Database["public"]["Enums"]["cafe_status"] | null
        }
        Relationships: []
      }
    }
    Functions: {
      cafe_is_open_during: {
        Args: { p_cafe_id: string; p_ends: string; p_starts: string }
        Returns: boolean
      }
      cafe_open_window: {
        Args: { p_cafe_id: string; p_day: string }
        Returns: unknown
      }
      cancel_booking: {
        Args: { p_booking_id: string }
        Returns: {
          cafe_id: string | null
          cafe_name: string | null
          cafe_slug: string | null
          created_at: string | null
          ends_at: string | null
          hold_expires_at: string | null
          hourly_rate_paise: number | null
          id: string | null
          lock_fee_paise: number | null
          seat_count: number | null
          seats: Json | null
          source: Database["public"]["Enums"]["booking_source"] | null
          starts_at: string | null
          status: Database["public"]["Enums"]["booking_status"] | null
          tier_id: string | null
          tier_kind: Database["public"]["Enums"]["station_kind"] | null
          tier_name: string | null
          total_paise: number | null
          updated_at: string | null
          user_id: string | null
        }
        SetofOptions: {
          from: "*"
          to: "booking_details"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      confirm_booking: {
        Args: { p_booking_id: string }
        Returns: {
          cafe_id: string | null
          cafe_name: string | null
          cafe_slug: string | null
          created_at: string | null
          ends_at: string | null
          hold_expires_at: string | null
          hourly_rate_paise: number | null
          id: string | null
          lock_fee_paise: number | null
          seat_count: number | null
          seats: Json | null
          source: Database["public"]["Enums"]["booking_source"] | null
          starts_at: string | null
          status: Database["public"]["Enums"]["booking_status"] | null
          tier_id: string | null
          tier_kind: Database["public"]["Enums"]["station_kind"] | null
          tier_name: string | null
          total_paise: number | null
          updated_at: string | null
          user_id: string | null
        }
        SetofOptions: {
          from: "*"
          to: "booking_details"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      create_booking: {
        Args: {
          p_cafe_id: string
          p_duration_minutes: number
          p_seat_count: number
          p_starts_at: string
          p_tier_id: string
        }
        Returns: {
          cafe_id: string | null
          cafe_name: string | null
          cafe_slug: string | null
          created_at: string | null
          ends_at: string | null
          hold_expires_at: string | null
          hourly_rate_paise: number | null
          id: string | null
          lock_fee_paise: number | null
          seat_count: number | null
          seats: Json | null
          source: Database["public"]["Enums"]["booking_source"] | null
          starts_at: string | null
          status: Database["public"]["Enums"]["booking_status"] | null
          tier_id: string | null
          tier_kind: Database["public"]["Enums"]["station_kind"] | null
          tier_name: string | null
          total_paise: number | null
          updated_at: string | null
          user_id: string | null
        }
        SetofOptions: {
          from: "*"
          to: "booking_details"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      expire_holds: { Args: never; Returns: number }
      get_availability: {
        Args: {
          p_day: string
          p_duration_minutes?: number
          p_step_minutes?: number
          p_tier_id: string
        }
        Returns: {
          free_seats: number
          starts_at: string
        }[]
      }
    }
    Enums: {
      booking_source: "app" | "counter"
      booking_status:
        "held" | "confirmed" | "cancelled" | "expired" | "completed" | "no_show"
      cafe_member_role: "owner" | "staff"
      cafe_status: "draft" | "live" | "paused"
      station_kind:
        "pc" | "ps5" | "xbox" | "switch" | "vr" | "sim_racing" | "other"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      booking_source: ["app", "counter"],
      booking_status: [
        "held",
        "confirmed",
        "cancelled",
        "expired",
        "completed",
        "no_show",
      ],
      cafe_member_role: ["owner", "staff"],
      cafe_status: ["draft", "live", "paused"],
      station_kind: [
        "pc",
        "ps5",
        "xbox",
        "switch",
        "vr",
        "sim_racing",
        "other",
      ],
    },
  },
} as const

