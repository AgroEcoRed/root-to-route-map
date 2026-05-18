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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      custom_categories: {
        Row: {
          created_at: string
          created_by: string
          id: string
          name: string
          type: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          name: string
          type: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          name?: string
          type?: string
        }
        Relationships: []
      }
      gov_programs: {
        Row: {
          city: string | null
          contact: string | null
          country: string
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          last_synced_at: string | null
          name: string
          organization: string | null
          region: string | null
          source: string
          source_html_hash: string | null
          topics: string[]
          updated_at: string
          url: string
        }
        Insert: {
          city?: string | null
          contact?: string | null
          country: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          last_synced_at?: string | null
          name: string
          organization?: string | null
          region?: string | null
          source?: string
          source_html_hash?: string | null
          topics?: string[]
          updated_at?: string
          url: string
        }
        Update: {
          city?: string | null
          contact?: string | null
          country?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          last_synced_at?: string | null
          name?: string
          organization?: string | null
          region?: string | null
          source?: string
          source_html_hash?: string | null
          topics?: string[]
          updated_at?: string
          url?: string
        }
        Relationships: []
      }
      library_collections: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      library_items: {
        Row: {
          abstract: string | null
          authors: string[]
          collection_id: string | null
          created_at: string
          doi: string | null
          file_path: string | null
          id: string
          item_type: string
          journal: string | null
          publisher: string | null
          tags: string[]
          title: string
          updated_at: string
          uploaded_by: string
          url: string | null
          year: number | null
        }
        Insert: {
          abstract?: string | null
          authors?: string[]
          collection_id?: string | null
          created_at?: string
          doi?: string | null
          file_path?: string | null
          id?: string
          item_type?: string
          journal?: string | null
          publisher?: string | null
          tags?: string[]
          title: string
          updated_at?: string
          uploaded_by: string
          url?: string | null
          year?: number | null
        }
        Update: {
          abstract?: string | null
          authors?: string[]
          collection_id?: string | null
          created_at?: string
          doi?: string | null
          file_path?: string | null
          id?: string
          item_type?: string
          journal?: string | null
          publisher?: string | null
          tags?: string[]
          title?: string
          updated_at?: string
          uploaded_by?: string
          url?: string | null
          year?: number | null
        }
        Relationships: []
      }
      profile_milestones: {
        Row: {
          created_at: string
          description: string | null
          id: string
          milestone_type: string
          occurred_on: string
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          milestone_type?: string
          occurred_on: string
          title: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          milestone_type?: string
          occurred_on?: string
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          actor_type: Database["public"]["Enums"]["actor_type"]
          avatar_url: string | null
          capacity: string | null
          certification:
            | Database["public"]["Enums"]["certification_level"]
            | null
          created_at: string
          description: string | null
          display_name: string | null
          id: string
          lat: number | null
          lng: number | null
          location: string | null
          phone: string | null
          production_methods: string | null
          products: string[] | null
          spg_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          actor_type?: Database["public"]["Enums"]["actor_type"]
          avatar_url?: string | null
          capacity?: string | null
          certification?:
            | Database["public"]["Enums"]["certification_level"]
            | null
          created_at?: string
          description?: string | null
          display_name?: string | null
          id?: string
          lat?: number | null
          lng?: number | null
          location?: string | null
          phone?: string | null
          production_methods?: string | null
          products?: string[] | null
          spg_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          actor_type?: Database["public"]["Enums"]["actor_type"]
          avatar_url?: string | null
          capacity?: string | null
          certification?:
            | Database["public"]["Enums"]["certification_level"]
            | null
          created_at?: string
          description?: string | null
          display_name?: string | null
          id?: string
          lat?: number | null
          lng?: number | null
          location?: string | null
          phone?: string | null
          production_methods?: string | null
          products?: string[] | null
          spg_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_spg_id_fkey"
            columns: ["spg_id"]
            isOneToOne: false
            referencedRelation: "spgs"
            referencedColumns: ["id"]
          },
        ]
      }
      seller_reviews: {
        Row: {
          comment: string | null
          created_at: string
          id: string
          rating: number
          reviewer_id: string
          seller_name: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          rating: number
          reviewer_id: string
          seller_name: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          rating?: number
          reviewer_id?: string
          seller_name?: string
        }
        Relationships: []
      }
      spg_evaluations: {
        Row: {
          created_at: string
          evaluated_at: string | null
          evaluation_type: string
          id: string
          notes: string | null
          result: string | null
          spg_id: string
          title: string
        }
        Insert: {
          created_at?: string
          evaluated_at?: string | null
          evaluation_type: string
          id?: string
          notes?: string | null
          result?: string | null
          spg_id: string
          title: string
        }
        Update: {
          created_at?: string
          evaluated_at?: string | null
          evaluation_type?: string
          id?: string
          notes?: string | null
          result?: string | null
          spg_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "spg_evaluations_spg_id_fkey"
            columns: ["spg_id"]
            isOneToOne: false
            referencedRelation: "spgs"
            referencedColumns: ["id"]
          },
        ]
      }
      spgs: {
        Row: {
          created_at: string
          description: string | null
          evaluation_form_url: string | null
          id: string
          methodology: string | null
          name: string
          peer_visit_count: number
          region: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          evaluation_form_url?: string | null
          id?: string
          methodology?: string | null
          name: string
          peer_visit_count?: number
          region?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          evaluation_form_url?: string | null
          id?: string
          methodology?: string | null
          name?: string
          peer_visit_count?: number
          region?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      transition_records: {
        Row: {
          created_at: string
          dimension: Database["public"]["Enums"]["transition_dimension"]
          id: string
          indicator_key: string
          notes: string | null
          period_quarter: number | null
          period_year: number
          updated_at: string
          user_id: string
          value: number
        }
        Insert: {
          created_at?: string
          dimension: Database["public"]["Enums"]["transition_dimension"]
          id?: string
          indicator_key: string
          notes?: string | null
          period_quarter?: number | null
          period_year: number
          updated_at?: string
          user_id: string
          value: number
        }
        Update: {
          created_at?: string
          dimension?: Database["public"]["Enums"]["transition_dimension"]
          id?: string
          indicator_key?: string
          notes?: string | null
          period_quarter?: number | null
          period_year?: number
          updated_at?: string
          user_id?: string
          value?: number
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
      actor_type:
        | "producer"
        | "cooperative"
        | "social_kitchen"
        | "restaurant"
        | "retail"
        | "consumer"
        | "institution"
        | "logistics"
        | "processing"
        | "agroecological_node"
        | "seed_bank"
        | "composting_center"
        | "research_center"
        | "solidarity_intermediary"
        | "community_garden"
        | "consumer_node"
        | "individual_consumer"
        | "food_bank"
        | "consumer_cooperative"
        | "community_org"
        | "health_food_store"
        | "agroecological_store"
        | "agroecological_fair"
        | "agroecological_market"
        | "bio_input_supplier"
      certification_level: "red" | "yellow" | "green" | "none_spg"
      transition_dimension:
        | "agronomic"
        | "ecological"
        | "economic"
        | "social"
        | "cultural"
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
      actor_type: [
        "producer",
        "cooperative",
        "social_kitchen",
        "restaurant",
        "retail",
        "consumer",
        "institution",
        "logistics",
        "processing",
        "agroecological_node",
        "seed_bank",
        "composting_center",
        "research_center",
        "solidarity_intermediary",
        "community_garden",
        "consumer_node",
        "individual_consumer",
        "food_bank",
        "consumer_cooperative",
        "community_org",
        "health_food_store",
        "agroecological_store",
        "agroecological_fair",
        "agroecological_market",
        "bio_input_supplier",
      ],
      certification_level: ["red", "yellow", "green", "none_spg"],
      transition_dimension: [
        "agronomic",
        "ecological",
        "economic",
        "social",
        "cultural",
      ],
    },
  },
} as const
