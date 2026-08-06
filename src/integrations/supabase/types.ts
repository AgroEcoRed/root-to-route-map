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
      actor_connections: {
        Row: {
          connection_type: Database["public"]["Enums"]["connection_type"]
          created_at: string
          created_by: string | null
          declared: boolean
          id: string
          note: string | null
          source_layer_actor_id: string | null
          source_profile_id: string | null
          strength: number
          target_layer_actor_id: string | null
          target_profile_id: string | null
          updated_at: string
        }
        Insert: {
          connection_type?: Database["public"]["Enums"]["connection_type"]
          created_at?: string
          created_by?: string | null
          declared?: boolean
          id?: string
          note?: string | null
          source_layer_actor_id?: string | null
          source_profile_id?: string | null
          strength?: number
          target_layer_actor_id?: string | null
          target_profile_id?: string | null
          updated_at?: string
        }
        Update: {
          connection_type?: Database["public"]["Enums"]["connection_type"]
          created_at?: string
          created_by?: string | null
          declared?: boolean
          id?: string
          note?: string | null
          source_layer_actor_id?: string | null
          source_profile_id?: string | null
          strength?: number
          target_layer_actor_id?: string | null
          target_profile_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "actor_connections_source_layer_actor_id_fkey"
            columns: ["source_layer_actor_id"]
            isOneToOne: false
            referencedRelation: "layer_actors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "actor_connections_source_profile_id_fkey"
            columns: ["source_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "actor_connections_source_profile_id_fkey"
            columns: ["source_profile_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "actor_connections_target_layer_actor_id_fkey"
            columns: ["target_layer_actor_id"]
            isOneToOne: false
            referencedRelation: "layer_actors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "actor_connections_target_profile_id_fkey"
            columns: ["target_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "actor_connections_target_profile_id_fkey"
            columns: ["target_profile_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      actor_endorsements: {
        Row: {
          created_at: string
          endorser_display: string | null
          endorser_user_id: string
          id: string
          layer_actor_id: string
          note: string | null
        }
        Insert: {
          created_at?: string
          endorser_display?: string | null
          endorser_user_id: string
          id?: string
          layer_actor_id: string
          note?: string | null
        }
        Update: {
          created_at?: string
          endorser_display?: string | null
          endorser_user_id?: string
          id?: string
          layer_actor_id?: string
          note?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "actor_endorsements_layer_actor_id_fkey"
            columns: ["layer_actor_id"]
            isOneToOne: false
            referencedRelation: "layer_actors"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_hints: {
        Row: {
          content: string
          created_at: string
          created_by: string | null
          enabled: boolean
          id: string
          priority: number
          scope: Database["public"]["Enums"]["ai_hint_scope"]
          tags: string[]
          title: string
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          created_by?: string | null
          enabled?: boolean
          id?: string
          priority?: number
          scope?: Database["public"]["Enums"]["ai_hint_scope"]
          tags?: string[]
          title: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          created_by?: string | null
          enabled?: boolean
          id?: string
          priority?: number
          scope?: Database["public"]["Enums"]["ai_hint_scope"]
          tags?: string[]
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
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
      data_source_settings: {
        Row: {
          enabled: boolean
          label: string
          source_id: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          enabled?: boolean
          label: string
          source_id: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          enabled?: boolean
          label?: string
          source_id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      events: {
        Row: {
          approved: boolean
          co_organizers: string[]
          contact: string | null
          contact_email: string | null
          contact_phone: string | null
          created_at: string
          created_by: string | null
          custom_type: string | null
          description: string | null
          edit_token: string
          ends_at: string | null
          event_type: Database["public"]["Enums"]["event_type"]
          extra_organizer_names: string[]
          flyer_url: string | null
          focal_email: string | null
          focal_name: string | null
          id: string
          lat: number | null
          link: string | null
          lng: number | null
          location_name: string | null
          source: Database["public"]["Enums"]["event_source"]
          starts_at: string
          submitted_by_name: string | null
          title: string
          updated_at: string
        }
        Insert: {
          approved?: boolean
          co_organizers?: string[]
          contact?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          created_by?: string | null
          custom_type?: string | null
          description?: string | null
          edit_token?: string
          ends_at?: string | null
          event_type?: Database["public"]["Enums"]["event_type"]
          extra_organizer_names?: string[]
          flyer_url?: string | null
          focal_email?: string | null
          focal_name?: string | null
          id?: string
          lat?: number | null
          link?: string | null
          lng?: number | null
          location_name?: string | null
          source?: Database["public"]["Enums"]["event_source"]
          starts_at: string
          submitted_by_name?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          approved?: boolean
          co_organizers?: string[]
          contact?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          created_by?: string | null
          custom_type?: string | null
          description?: string | null
          edit_token?: string
          ends_at?: string | null
          event_type?: Database["public"]["Enums"]["event_type"]
          extra_organizer_names?: string[]
          flyer_url?: string | null
          focal_email?: string | null
          focal_name?: string | null
          id?: string
          lat?: number | null
          link?: string | null
          lng?: number | null
          location_name?: string | null
          source?: Database["public"]["Enums"]["event_source"]
          starts_at?: string
          submitted_by_name?: string | null
          title?: string
          updated_at?: string
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
      layer_actors: {
        Row: {
          actor_type: string | null
          address: string | null
          confirmation_email: string | null
          confirmation_phone: string | null
          confirmation_sent_at: string | null
          confirmation_status: string
          confirmation_token: string | null
          confirmed_at: string | null
          confirmed_by: string | null
          contact: string | null
          created_at: string
          created_by: string | null
          delivery_days: string[] | null
          description: string | null
          extra: Json
          family: string | null
          id: string
          lat: number
          lng: number
          name: string
          source_id: string
          updated_at: string
          verified_at: string | null
          verified_by_role: string | null
        }
        Insert: {
          actor_type?: string | null
          address?: string | null
          confirmation_email?: string | null
          confirmation_phone?: string | null
          confirmation_sent_at?: string | null
          confirmation_status?: string
          confirmation_token?: string | null
          confirmed_at?: string | null
          confirmed_by?: string | null
          contact?: string | null
          created_at?: string
          created_by?: string | null
          delivery_days?: string[] | null
          description?: string | null
          extra?: Json
          family?: string | null
          id?: string
          lat: number
          lng: number
          name: string
          source_id: string
          updated_at?: string
          verified_at?: string | null
          verified_by_role?: string | null
        }
        Update: {
          actor_type?: string | null
          address?: string | null
          confirmation_email?: string | null
          confirmation_phone?: string | null
          confirmation_sent_at?: string | null
          confirmation_status?: string
          confirmation_token?: string | null
          confirmed_at?: string | null
          confirmed_by?: string | null
          contact?: string | null
          created_at?: string
          created_by?: string | null
          delivery_days?: string[] | null
          description?: string | null
          extra?: Json
          family?: string | null
          id?: string
          lat?: number
          lng?: number
          name?: string
          source_id?: string
          updated_at?: string
          verified_at?: string | null
          verified_by_role?: string | null
        }
        Relationships: []
      }
      layer_manager_invites: {
        Row: {
          accepted_at: string | null
          accepted_by: string | null
          created_at: string
          email: string
          id: string
          invited_by: string | null
          layer_id: string
          updated_at: string
        }
        Insert: {
          accepted_at?: string | null
          accepted_by?: string | null
          created_at?: string
          email: string
          id?: string
          invited_by?: string | null
          layer_id: string
          updated_at?: string
        }
        Update: {
          accepted_at?: string | null
          accepted_by?: string | null
          created_at?: string
          email?: string
          id?: string
          invited_by?: string | null
          layer_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      layer_managers: {
        Row: {
          created_at: string
          granted_by: string | null
          id: string
          layer_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          granted_by?: string | null
          id?: string
          layer_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          granted_by?: string | null
          id?: string
          layer_id?: string
          updated_at?: string
          user_id?: string
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
          actor_id: string | null
          attribution: string | null
          authors: string[]
          collection_id: string | null
          created_at: string
          doi: string | null
          file_path: string | null
          id: string
          item_type: string
          journal: string | null
          lat: number | null
          license: string
          lng: number | null
          publisher: string | null
          route_geojson: Json | null
          tags: string[]
          title: string
          updated_at: string
          uploaded_by: string
          url: string | null
          year: number | null
        }
        Insert: {
          abstract?: string | null
          actor_id?: string | null
          attribution?: string | null
          authors?: string[]
          collection_id?: string | null
          created_at?: string
          doi?: string | null
          file_path?: string | null
          id?: string
          item_type?: string
          journal?: string | null
          lat?: number | null
          license?: string
          lng?: number | null
          publisher?: string | null
          route_geojson?: Json | null
          tags?: string[]
          title: string
          updated_at?: string
          uploaded_by: string
          url?: string | null
          year?: number | null
        }
        Update: {
          abstract?: string | null
          actor_id?: string | null
          attribution?: string | null
          authors?: string[]
          collection_id?: string | null
          created_at?: string
          doi?: string | null
          file_path?: string | null
          id?: string
          item_type?: string
          journal?: string | null
          lat?: number | null
          license?: string
          lng?: number | null
          publisher?: string | null
          route_geojson?: Json | null
          tags?: string[]
          title?: string
          updated_at?: string
          uploaded_by?: string
          url?: string | null
          year?: number | null
        }
        Relationships: []
      }
      mtr_facets: {
        Row: {
          code: string
          external_id: string | null
          facet_code: string | null
          facet_name: string | null
          name: string
          updated_at: string
        }
        Insert: {
          code: string
          external_id?: string | null
          facet_code?: string | null
          facet_name?: string | null
          name: string
          updated_at?: string
        }
        Update: {
          code?: string
          external_id?: string | null
          facet_code?: string | null
          facet_name?: string | null
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      mtr_products: {
        Row: {
          collection_ids: string[] | null
          currency: string | null
          description: string | null
          facet_value_ids: string[] | null
          image_url: string | null
          in_stock: boolean | null
          name: string
          price_cents: number | null
          product_id: string
          slug: string | null
          source_url: string | null
          updated_at: string
        }
        Insert: {
          collection_ids?: string[] | null
          currency?: string | null
          description?: string | null
          facet_value_ids?: string[] | null
          image_url?: string | null
          in_stock?: boolean | null
          name: string
          price_cents?: number | null
          product_id: string
          slug?: string | null
          source_url?: string | null
          updated_at?: string
        }
        Update: {
          collection_ids?: string[] | null
          currency?: string | null
          description?: string | null
          facet_value_ids?: string[] | null
          image_url?: string | null
          in_stock?: boolean | null
          name?: string
          price_cents?: number | null
          product_id?: string
          slug?: string | null
          source_url?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      mtr_sync_log: {
        Row: {
          error_message: string | null
          facets_synced: number | null
          finished_at: string | null
          id: string
          products_synced: number | null
          started_at: string
          status: string
        }
        Insert: {
          error_message?: string | null
          facets_synced?: number | null
          finished_at?: string | null
          id?: string
          products_synced?: number | null
          started_at?: string
          status?: string
        }
        Update: {
          error_message?: string | null
          facets_synced?: number | null
          finished_at?: string | null
          id?: string
          products_synced?: number | null
          started_at?: string
          status?: string
        }
        Relationships: []
      }
      preliminary_imports: {
        Row: {
          created_at: string
          file_path: string | null
          id: string
          notes: string | null
          source_type: string
          status: string
          updated_at: string
          url: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          file_path?: string | null
          id?: string
          notes?: string | null
          source_type: string
          status?: string
          updated_at?: string
          url?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          file_path?: string | null
          id?: string
          notes?: string | null
          source_type?: string
          status?: string
          updated_at?: string
          url?: string | null
          user_id?: string
        }
        Relationships: []
      }
      producer_media: {
        Row: {
          attribution: string | null
          caption: string | null
          created_at: string
          duration_seconds: number | null
          id: string
          license: string
          media_type: string
          media_url: string
          size_bytes: number | null
          sort_order: number
          storage_path: string
          user_id: string
        }
        Insert: {
          attribution?: string | null
          caption?: string | null
          created_at?: string
          duration_seconds?: number | null
          id?: string
          license?: string
          media_type: string
          media_url: string
          size_bytes?: number | null
          sort_order?: number
          storage_path: string
          user_id: string
        }
        Update: {
          attribution?: string | null
          caption?: string | null
          created_at?: string
          duration_seconds?: number | null
          id?: string
          license?: string
          media_type?: string
          media_url?: string
          size_bytes?: number | null
          sort_order?: number
          storage_path?: string
          user_id?: string
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
          content_license: string
          created_at: string
          description: string | null
          display_name: string | null
          geolocation_source: string | null
          id: string
          lat: number | null
          lng: number | null
          location: string | null
          phone: string | null
          production_methods: string | null
          products: string[] | null
          registration_completed: boolean
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
          content_license?: string
          created_at?: string
          description?: string | null
          display_name?: string | null
          geolocation_source?: string | null
          id?: string
          lat?: number | null
          lng?: number | null
          location?: string | null
          phone?: string | null
          production_methods?: string | null
          products?: string[] | null
          registration_completed?: boolean
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
          content_license?: string
          created_at?: string
          description?: string | null
          display_name?: string | null
          geolocation_source?: string | null
          id?: string
          lat?: number | null
          lng?: number | null
          location?: string | null
          phone?: string | null
          production_methods?: string | null
          products?: string[] | null
          registration_completed?: boolean
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
      referrals: {
        Row: {
          created_at: string
          id: string
          invited_user_id: string | null
          invitee_contact: string
          invitee_contact_type: string
          invitee_name: string
          joined_at: string | null
          personal_message: string | null
          referrer_user_id: string
          status: string
          token: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          invited_user_id?: string | null
          invitee_contact: string
          invitee_contact_type: string
          invitee_name: string
          joined_at?: string | null
          personal_message?: string | null
          referrer_user_id: string
          status?: string
          token?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          invited_user_id?: string | null
          invitee_contact?: string
          invitee_contact_type?: string
          invitee_name?: string
          joined_at?: string | null
          personal_message?: string | null
          referrer_user_id?: string
          status?: string
          token?: string
          updated_at?: string
        }
        Relationships: []
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
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      actor_endorsement_counts: {
        Row: {
          count: number | null
          last_at: string | null
          layer_actor_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "actor_endorsements_layer_actor_id_fkey"
            columns: ["layer_actor_id"]
            isOneToOne: false
            referencedRelation: "layer_actors"
            referencedColumns: ["id"]
          },
        ]
      }
      public_profiles: {
        Row: {
          actor_type: Database["public"]["Enums"]["actor_type"] | null
          avatar_url: string | null
          capacity: string | null
          certification:
            | Database["public"]["Enums"]["certification_level"]
            | null
          content_license: string | null
          created_at: string | null
          description: string | null
          display_name: string | null
          id: string | null
          lat: number | null
          lng: number | null
          location: string | null
          production_methods: string | null
          products: string[] | null
          spg_id: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          actor_type?: Database["public"]["Enums"]["actor_type"] | null
          avatar_url?: string | null
          capacity?: string | null
          certification?:
            | Database["public"]["Enums"]["certification_level"]
            | null
          content_license?: string | null
          created_at?: string | null
          description?: string | null
          display_name?: string | null
          id?: string | null
          lat?: number | null
          lng?: number | null
          location?: string | null
          production_methods?: string | null
          products?: string[] | null
          spg_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          actor_type?: Database["public"]["Enums"]["actor_type"] | null
          avatar_url?: string | null
          capacity?: string | null
          certification?:
            | Database["public"]["Enums"]["certification_level"]
            | null
          content_license?: string | null
          created_at?: string | null
          description?: string | null
          display_name?: string | null
          id?: string | null
          lat?: number | null
          lng?: number | null
          location?: string | null
          production_methods?: string | null
          products?: string[] | null
          spg_id?: string | null
          updated_at?: string | null
          user_id?: string | null
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
    }
    Functions: {
      can_manage_layer: {
        Args: { _layer_id: string; _user_id: string }
        Returns: boolean
      }
      claim_layer_manager_invites: {
        Args: never
        Returns: {
          created_at: string
          granted_by: string | null
          id: string
          layer_id: string
          updated_at: string
          user_id: string
        }[]
        SetofOptions: {
          from: "*"
          to: "layer_managers"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      claim_referral: {
        Args: { _token: string }
        Returns: {
          created_at: string
          id: string
          invited_user_id: string | null
          invitee_contact: string
          invitee_contact_type: string
          invitee_name: string
          joined_at: string | null
          personal_message: string | null
          referrer_user_id: string
          status: string
          token: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "referrals"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      confirm_actor_by_token: {
        Args: {
          _address?: string
          _contact?: string
          _decision: string
          _delivery_days?: string[]
          _description?: string
          _lat?: number
          _lng?: number
          _name?: string
          _token: string
        }
        Returns: {
          actor_type: string | null
          address: string | null
          confirmation_email: string | null
          confirmation_phone: string | null
          confirmation_sent_at: string | null
          confirmation_status: string
          confirmation_token: string | null
          confirmed_at: string | null
          confirmed_by: string | null
          contact: string | null
          created_at: string
          created_by: string | null
          delivery_days: string[] | null
          description: string | null
          extra: Json
          family: string | null
          id: string
          lat: number
          lng: number
          name: string
          source_id: string
          updated_at: string
          verified_at: string | null
          verified_by_role: string | null
        }
        SetofOptions: {
          from: "*"
          to: "layer_actors"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      declare_connection_by_token: {
        Args: {
          _connection_type: Database["public"]["Enums"]["connection_type"]
          _note?: string
          _strength?: number
          _target_layer_actor_id: string
          _token: string
        }
        Returns: {
          connection_type: Database["public"]["Enums"]["connection_type"]
          created_at: string
          created_by: string | null
          declared: boolean
          id: string
          note: string | null
          source_layer_actor_id: string | null
          source_profile_id: string | null
          strength: number
          target_layer_actor_id: string | null
          target_profile_id: string | null
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "actor_connections"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      get_actor_by_token: {
        Args: { _token: string }
        Returns: {
          actor_type: string | null
          address: string | null
          confirmation_email: string | null
          confirmation_phone: string | null
          confirmation_sent_at: string | null
          confirmation_status: string
          confirmation_token: string | null
          confirmed_at: string | null
          confirmed_by: string | null
          contact: string | null
          created_at: string
          created_by: string | null
          delivery_days: string[] | null
          description: string | null
          extra: Json
          family: string | null
          id: string
          lat: number
          lng: number
          name: string
          source_id: string
          updated_at: string
          verified_at: string | null
          verified_by_role: string | null
        }
        SetofOptions: {
          from: "*"
          to: "layer_actors"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      get_actor_confirmation_contact: {
        Args: { _id: string }
        Returns: {
          confirmation_email: string
          confirmation_phone: string
        }[]
      }
      get_actor_confirmation_token: { Args: { _id: string }; Returns: string }
      get_event_by_edit_token: {
        Args: { _token: string }
        Returns: {
          approved: boolean
          co_organizers: string[]
          contact: string | null
          contact_email: string | null
          contact_phone: string | null
          created_at: string
          created_by: string | null
          custom_type: string | null
          description: string | null
          edit_token: string
          ends_at: string | null
          event_type: Database["public"]["Enums"]["event_type"]
          extra_organizer_names: string[]
          flyer_url: string | null
          focal_email: string | null
          focal_name: string | null
          id: string
          lat: number | null
          link: string | null
          lng: number | null
          location_name: string | null
          source: Database["public"]["Enums"]["event_source"]
          starts_at: string
          submitted_by_name: string | null
          title: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "events"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      get_my_event_edit_token: { Args: { _event_id: string }; Returns: string }
      get_referral_by_token: {
        Args: { _token: string }
        Returns: {
          invitee_name: string
          referrer_name: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      update_event_by_token: {
        Args: {
          _contact?: string
          _contact_email?: string
          _contact_phone?: string
          _description?: string
          _ends_at?: string
          _focal_email?: string
          _focal_name?: string
          _lat?: number
          _link?: string
          _lng?: number
          _location_name?: string
          _starts_at?: string
          _title?: string
          _token: string
        }
        Returns: {
          approved: boolean
          co_organizers: string[]
          contact: string | null
          contact_email: string | null
          contact_phone: string | null
          created_at: string
          created_by: string | null
          custom_type: string | null
          description: string | null
          edit_token: string
          ends_at: string | null
          event_type: Database["public"]["Enums"]["event_type"]
          extra_organizer_names: string[]
          flyer_url: string | null
          focal_email: string | null
          focal_name: string | null
          id: string
          lat: number | null
          link: string | null
          lng: number | null
          location_name: string | null
          source: Database["public"]["Enums"]["event_source"]
          starts_at: string
          submitted_by_name: string | null
          title: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "events"
          isOneToOne: true
          isSetofReturn: false
        }
      }
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
      ai_hint_scope: "registration" | "chatbot" | "both"
      app_role: "admin" | "moderator" | "user"
      certification_level: "red" | "yellow" | "green" | "none_spg"
      connection_type:
        | "proveedor"
        | "comprador"
        | "colaboracion"
        | "spg"
        | "intercambio"
        | "red"
        | "otro"
      event_source: "user" | "admin" | "community"
      event_type:
        | "feria"
        | "intercambio"
        | "formacion"
        | "otro"
        | "conferencia_jornada"
        | "taller"
        | "encuentro"
        | "voluntariado"
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
      ai_hint_scope: ["registration", "chatbot", "both"],
      app_role: ["admin", "moderator", "user"],
      certification_level: ["red", "yellow", "green", "none_spg"],
      connection_type: [
        "proveedor",
        "comprador",
        "colaboracion",
        "spg",
        "intercambio",
        "red",
        "otro",
      ],
      event_source: ["user", "admin", "community"],
      event_type: [
        "feria",
        "intercambio",
        "formacion",
        "otro",
        "conferencia_jornada",
        "taller",
        "encuentro",
        "voluntariado",
      ],
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
