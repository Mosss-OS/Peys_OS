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
      notifications: {
        Row: {
          created_at: string
          id: string
          message: string
          payment_id: string | null
          read: boolean
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          payment_id?: string | null
          read?: boolean
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          payment_id?: string | null
          read?: boolean
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          blockchain_payment_id: string | null
          claim_link: string
          claim_secret: string
          claimed_at: string | null
          claimed_by_user_id: string | null
          created_at: string
          expires_at: string
          id: string
          memo: string | null
          payment_id: string
          recipient_email: string
          sender_email: string
          sender_user_id: string
          sender_wallet: string | null
          status: string
          token: string
          tx_hash: string | null
          updated_at: string
        }
        Insert: {
          amount: number
          blockchain_payment_id?: string | null
          claim_link: string
          claim_secret: string
          claimed_at?: string | null
          claimed_by_user_id?: string | null
          created_at?: string
          expires_at: string
          id?: string
          memo?: string | null
          payment_id: string
          recipient_email: string
          sender_email: string
          sender_user_id: string
          sender_wallet?: string | null
          status?: string
          token: string
          tx_hash?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          blockchain_payment_id?: string | null
          claim_link?: string
          claim_secret?: string
          claimed_at?: string | null
          claimed_by_user_id?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          memo?: string | null
          payment_id?: string
          recipient_email?: string
          sender_email?: string
          sender_user_id?: string
          sender_wallet?: string | null
          status?: string
          token?: string
          tx_hash?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      contacts: {
        Row: {
          id: string
          user_id: string | null
          name: string
          email: string | null
          wallet_address: string | null
          phone: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          name: string
          email?: string | null
          wallet_address?: string | null
          phone?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          name?: string
          email?: string | null
          wallet_address?: string | null
          phone?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      payment_requests: {
        Row: {
          id: string
          user_id: string | null
          wallet_address: string | null
          requester_email: string | null
          payer_email: string | null
          amount: number
          token: string
          memo: string | null
          status: string
          request_link: string
          paid_at: string | null
          expires_at: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          wallet_address?: string | null
          requester_email?: string | null
          payer_email?: string | null
          amount: number
          token: string
          memo?: string | null
          status?: string
          request_link: string
          paid_at?: string | null
          expires_at: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          wallet_address?: string | null
          requester_email?: string | null
          payer_email?: string | null
          amount?: number
          token?: string
          memo?: string | null
          status?: string
          request_link?: string
          paid_at?: string | null
          expires_at?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      payment_streams: {
        Row: {
          id: string
          user_id: string | null
          wallet_address: string | null
          recipient_address: string
          recipient_email: string | null
          token: string
          total_amount: number
          streamed_amount: number
          rate_per_second: number
          status: string
          started_at: string
          ends_at: string
          cancelled_at: string | null
          memo: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          wallet_address?: string | null
          recipient_address: string
          recipient_email?: string | null
          token: string
          total_amount: number
          streamed_amount?: number
          rate_per_second: number
          status?: string
          started_at?: string
          ends_at: string
          cancelled_at?: string | null
          memo?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          wallet_address?: string | null
          recipient_address?: string
          recipient_email?: string | null
          token?: string
          total_amount?: number
          streamed_amount?: number
          rate_per_second?: number
          status?: string
          started_at?: string
          ends_at?: string
          cancelled_at?: string | null
          memo?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          account_type: string | null
          created_at: string
          display_name: string | null
          email: string | null
          id: string
          organization_name: string | null
          organization_type: string | null
          updated_at: string
          user_id: string
          wallet_address: string | null
        }
        Insert: {
          account_type?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          organization_name?: string | null
          organization_type?: string | null
          updated_at?: string
          user_id: string
          wallet_address?: string | null
        }
        Update: {
          account_type?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          organization_name?: string | null
          organization_type?: string | null
          updated_at?: string
          user_id?: string
          wallet_address?: string | null
        }
        Relationships: []
      }
      organizations: {
        Row: {
          id: string
          name: string
          slug: string
          owner_id: string | null
          logo_url: string | null
          description: string | null
          website: string | null
          settings: Json
          metadata: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          owner_id?: string | null
          logo_url?: string | null
          description?: string | null
          website?: string | null
          settings?: Json
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          owner_id?: string | null
          logo_url?: string | null
          description?: string | null
          website?: string | null
          settings?: Json
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      organization_members: {
        Row: {
          id: string
          organization_id: string | null
          user_id: string | null
          email: string
          role: string
          status: string
          invited_by: string | null
          invited_at: string | null
          accepted_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id?: string | null
          user_id?: string | null
          email: string
          role: string
          status?: string
          invited_by?: string | null
          invited_at?: string | null
          accepted_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string | null
          user_id?: string | null
          email?: string
          role?: string
          status?: string
          invited_by?: string | null
          invited_at?: string | null
          accepted_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      payment_approvals: {
        Row: {
          id: string
          organization_id: string | null
          payment_id: string
          payment_type: string
          amount: number
          amount_usd: number | null
          token: string
          currency: string
          description: string | null
          status: string
          requested_by: string | null
          approved_by: string | null
          rejected_by: string | null
          approvers: Json
          required_approvals: number
          metadata: Json
          created_at: string
          approved_at: string | null
          rejected_at: string | null
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id?: string | null
          payment_id: string
          payment_type: string
          amount: number
          amount_usd?: number | null
          token?: string
          currency?: string
          description?: string | null
          status?: string
          requested_by?: string | null
          approved_by?: string | null
          rejected_by?: string | null
          approvers?: Json
          required_approvals?: number
          metadata?: Json
          created_at?: string
          approved_at?: string | null
          rejected_at?: string | null
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string | null
          payment_id?: string
          payment_type?: string
          amount?: number
          amount_usd?: number | null
          token?: string
          currency?: string
          description?: string | null
          status?: string
          requested_by?: string | null
          approved_by?: string | null
          rejected_by?: string | null
          approvers?: Json
          required_approvals?: number
          metadata?: Json
          created_at?: string
          approved_at?: string | null
          rejected_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      merchant_stores: {
        Row: {
          id: string
          organization_id: string | null
          name: string
          slug: string
          description: string | null
          logo_url: string | null
          website: string | null
          checkout_settings: Json
          notification_settings: Json
          metadata: Json
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id?: string | null
          name: string
          slug: string
          description?: string | null
          logo_url?: string | null
          website?: string | null
          checkout_settings?: Json
          notification_settings?: Json
          metadata?: Json
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string | null
          name?: string
          slug?: string
          description?: string | null
          logo_url?: string | null
          website?: string | null
          checkout_settings?: Json
          notification_settings?: Json
          metadata?: Json
          status?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      payment_links: {
        Row: {
          id: string
          user_id: string | null
          organization_id: string | null
          store_id: string | null
          title: string
          description: string | null
          amount: number | null
          amount_type: string
          min_amount: number | null
          max_amount: number | null
          token: string
          currency: string
          slug: string
          redirect_url: string | null
          customer_fields: Json
          expires_at: string | null
          max_uses: number | null
          use_count: number
          status: string
          metadata: Json
          frequency: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          organization_id?: string | null
          store_id?: string | null
          title: string
          description?: string | null
          amount?: number | null
          amount_type?: string
          min_amount?: number | null
          max_amount?: number | null
          token?: string
          currency?: string
          slug: string
          redirect_url?: string | null
          customer_fields?: Json
          expires_at?: string | null
          max_uses?: number | null
          use_count?: number
          status?: string
          metadata?: Json
          frequency?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          organization_id?: string | null
          store_id?: string | null
          title?: string
          description?: string | null
          amount?: number | null
          amount_type?: string
          min_amount?: number | null
          max_amount?: number | null
          token?: string
          currency?: string
          slug?: string
          redirect_url?: string | null
          customer_fields?: Json
          expires_at?: string | null
          max_uses?: number | null
          use_count?: number
          status?: string
          metadata?: Json
          frequency?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_subscriptions: {
        Row: {
          id: string
          payment_link_id: string | null
          payer_email: string
          amount: number
          token: string
          frequency: string
          status: string
          next_payment_date: string
          last_payment_date: string | null
          occurrences_completed: number
          max_occurrences: number | null
          memo: string | null
          metadata: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          payment_link_id?: string | null
          payer_email: string
          amount: number
          token?: string
          frequency: string
          status?: string
          next_payment_date: string
          last_payment_date?: string | null
          occurrences_completed?: number
          max_occurrences?: number | null
          memo?: string | null
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          payment_link_id?: string | null
          payer_email?: string
          amount?: number
          token?: string
          frequency?: string
          status?: string
          next_payment_date?: string
          last_payment_date?: string | null
          occurrences_completed?: number
          max_occurrences?: number | null
          memo?: string | null
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      contractors: {
        Row: {
          id: string
          organization_id: string | null
          email: string
          name: string
          wallet_address: string | null
          phone: string | null
          country: string | null
          currency: string
          rate_amount: number | null
          rate_type: string
          payment_method: string
          bank_details: Json
          status: string
          notes: string | null
          metadata: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id?: string | null
          email: string
          name: string
          wallet_address?: string | null
          phone?: string | null
          country?: string | null
          currency?: string
          rate_amount?: number | null
          rate_type?: string
          payment_method?: string
          bank_details?: Json
          status?: string
          notes?: string | null
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string | null
          email?: string
          name?: string
          wallet_address?: string | null
          phone?: string | null
          country?: string | null
          currency?: string
          rate_amount?: number | null
          rate_type?: string
          payment_method?: string
          bank_details?: Json
          status?: string
          notes?: string | null
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      payment_templates: {
        Row: {
          id: string
          organization_id: string | null
          name: string
          description: string | null
          token: string
          amount: number | null
          recipient_address: string | null
          recipient_email: string | null
          schedule: Json
          metadata: Json
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id?: string | null
          name: string
          description?: string | null
          token?: string
          amount?: number | null
          recipient_address?: string | null
          recipient_email?: string | null
          schedule?: Json
          metadata?: Json
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string | null
          name?: string
          description?: string | null
          token?: string
          amount?: number | null
          recipient_address?: string | null
          recipient_email?: string | null
          schedule?: Json
          metadata?: Json
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      approval_thresholds: {
        Row: {
          id: string
          organization_id: string | null
          name: string
          min_amount: number
          max_amount: number | null
          required_approvals: number
          approver_roles: Json
          conditions: Json
          metadata: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id?: string | null
          name: string
          min_amount: number
          max_amount?: number | null
          required_approvals?: number
          approver_roles?: Json
          conditions?: Json
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string | null
          name?: string
          min_amount?: number
          max_amount?: number | null
          required_approvals?: number
          approver_roles?: Json
          conditions?: Json
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      notify_recipient: {
        Args: {
          p_message: string
          p_payment_id: string
          p_recipient_email: string
          p_title: string
          p_type?: string
        }
        Returns: undefined
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
