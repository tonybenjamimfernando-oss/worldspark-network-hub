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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {

      conversations: {
        Row: {
          created_at: string;
          id: string;
          last_message_at: string;
          listing_id: string;
          participant_a: string;
          participant_b: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          last_message_at?: string;
          listing_id: string;
          participant_a: string;
          participant_b: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          last_message_at?: string;
          listing_id?: string;
          participant_a?: string;
          participant_b?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "conversations_listing_id_fkey";
            columns: ["listing_id"];
            isOneToOne: false;
            referencedRelation: "listings";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "conversations_participant_a_fkey";
            columns: ["participant_a"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "conversations_participant_b_fkey";
            columns: ["participant_b"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      }
      messages: {
        Row: {
          body: string;
          conversation_id: string;
          created_at: string;
          id: string;
          sender_id: string;
        };
        Insert: {
          body: string;
          conversation_id: string;
          created_at?: string;
          id?: string;
          sender_id: string;
        };
        Update: {
          body?: string;
          conversation_id?: string;
          created_at?: string;
          id?: string;
          sender_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey";
            columns: ["conversation_id"];
            isOneToOne: false;
            referencedRelation: "conversations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "messages_sender_id_fkey";
            columns: ["sender_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      }
      affiliate_links: {
        Row: {
          affiliate_id: string
          clicks: number
          code: string
          created_at: string
          id: string
          listing_id: string
        }
        Insert: {
          affiliate_id: string
          clicks?: number
          code?: string
          created_at?: string
          id?: string
          listing_id: string
        }
        Update: {
          affiliate_id?: string
          clicks?: number
          code?: string
          created_at?: string
          id?: string
          listing_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_links_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "affiliate_links_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      listings: {
        Row: {
          affiliate_commission: number | null
          affiliate_enabled: boolean
          brand: string | null
          budget_max: number | null
          category: string
          city: string | null
          condition: string | null
          contact_visibility: string
          country: string | null
          created_at: string
          currency: string
          deadline: string | null
          delivery: string | null
          description: string
          features: string | null
          id: string
          images: string[]
          latitude: number | null
          longitude: number | null
          is_external: boolean
          kind: Database["public"]["Enums"]["listing_kind"]
          outbound_clicks: number
          owner_id: string
          price: number | null
          publisher_relation: string
          quantity: number | null
          returns_policy: string | null
          source_checked_at: string | null
          source_platform: string | null
          source_store: string | null
          source_url: string | null
          status: string
          stock: number | null
          terms: string | null
          title: string
          updated_at: string
          variants: string | null
          video_url: string | null
          views: number
          warranty: string | null
        }
        Insert: {
          affiliate_commission?: number | null
          affiliate_enabled?: boolean
          brand?: string | null
          budget_max?: number | null
          category?: string
          city?: string | null
          condition?: string | null
          contact_visibility?: string
          country?: string | null
          created_at?: string
          currency?: string
          deadline?: string | null
          delivery?: string | null
          description?: string
          features?: string | null
          id?: string
          images?: string[]
          latitude?: number | null
          longitude?: number | null
          is_external?: boolean
          kind?: Database["public"]["Enums"]["listing_kind"]
          outbound_clicks?: number
          owner_id: string
          price?: number | null
          publisher_relation?: string
          quantity?: number | null
          returns_policy?: string | null
          source_checked_at?: string | null
          source_platform?: string | null
          source_store?: string | null
          source_url?: string | null
          status?: string
          stock?: number | null
          terms?: string | null
          title: string
          updated_at?: string
          variants?: string | null
          video_url?: string | null
          views?: number
          warranty?: string | null
        }
        Update: {
          affiliate_commission?: number | null
          affiliate_enabled?: boolean
          brand?: string | null
          budget_max?: number | null
          category?: string
          city?: string | null
          condition?: string | null
          contact_visibility?: string
          country?: string | null
          created_at?: string
          currency?: string
          deadline?: string | null
          delivery?: string | null
          description?: string
          features?: string | null
          id?: string
          images?: string[]
          latitude?: number | null
          longitude?: number | null
          is_external?: boolean
          kind?: Database["public"]["Enums"]["listing_kind"]
          outbound_clicks?: number
          owner_id?: string
          price?: number | null
          publisher_relation?: string
          quantity?: number | null
          returns_policy?: string | null
          source_checked_at?: string | null
          source_platform?: string | null
          source_store?: string | null
          source_url?: string | null
          status?: string
          stock?: number | null
          terms?: string | null
          title?: string
          updated_at?: string
          variants?: string | null
          video_url?: string | null
          views?: number
          warranty?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "listings_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          account_type: Database["public"]["Enums"]["account_type"]
          avatar_url: string | null
          bio: string | null
          city: string | null
          company_name: string | null
          country: string | null
          created_at: string
          display_name: string
          id: string
          is_public: boolean
          is_verified: boolean
          public_email: string | null
          public_phone: string | null
          services: string[]
          updated_at: string
          username: string | null
          website: string | null
        }
        Insert: {
          account_type?: Database["public"]["Enums"]["account_type"]
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          company_name?: string | null
          country?: string | null
          created_at?: string
          display_name?: string
          id: string
          is_public?: boolean
          is_verified?: boolean
          public_email?: string | null
          public_phone?: string | null
          services?: string[]
          updated_at?: string
          username?: string | null
          website?: string | null
        }
        Update: {
          account_type?: Database["public"]["Enums"]["account_type"]
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          company_name?: string | null
          country?: string | null
          created_at?: string
          display_name?: string
          id?: string
          is_public?: boolean
          is_verified?: boolean
          public_email?: string | null
          public_phone?: string | null
          services?: string[]
          updated_at?: string
          username?: string | null
          website?: string | null
        }
        Relationships: []
      }
      profile_private: {
        Row: {
          tax_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          tax_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          tax_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profile_private_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      proposals: {
        Row: {
          created_at: string
          currency: string
          delivery_days: number | null
          id: string
          message: string
          price: number | null
          request_id: string
          status: string
          supplier_id: string
        }
        Insert: {
          created_at?: string
          currency?: string
          delivery_days?: number | null
          id?: string
          message: string
          price?: number | null
          request_id: string
          status?: string
          supplier_id: string
        }
        Update: {
          created_at?: string
          currency?: string
          delivery_days?: number | null
          id?: string
          message?: string
          price?: number | null
          request_id?: string
          status?: string
          supplier_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "proposals_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposals_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      review_reports: {
        Row: {
          created_at: string
          id: string
          reason: string
          reporter_id: string
          review_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          reason: string
          reporter_id: string
          review_id: string
        }
        Update: {
          created_at?: string
          id?: string
          reason?: string
          reporter_id?: string
          review_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "review_reports_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_reports_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "reviews"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          author_id: string
          comment: string
          created_at: string
          id: string
          listing_id: string
          rating: number
          status: string
        }
        Insert: {
          author_id: string
          comment?: string
          created_at?: string
          id?: string
          listing_id: string
          rating: number
          status?: string
        }
        Update: {
          author_id?: string
          comment?: string
          created_at?: string
          id?: string
          listing_id?: string
          rating?: number
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      start_listing_conversation: { Args: { _listing_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      track_affiliate_click: { Args: { _code: string }; Returns: undefined }
      track_listing: {
        Args: { _id: string; _kind: string }
        Returns: undefined
      }
    }
    Enums: {
      account_type: "personal" | "business" | "provider"
      app_role: "admin" | "moderator" | "user"
      listing_kind: "product" | "service" | "request" | "opportunity"
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
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
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
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
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
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
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
      account_type: ["personal", "business", "provider"],
      app_role: ["admin", "moderator", "user"],
      listing_kind: ["product", "service", "request", "opportunity"],
    },
  },
} as const
