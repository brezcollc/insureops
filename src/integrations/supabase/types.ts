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
      agent_action_logs: {
        Row: {
          action_result: string | null
          action_taken: string
          created_at: string
          id: string
          request_id: string
          trigger_type: string
        }
        Insert: {
          action_result?: string | null
          action_taken: string
          created_at?: string
          id?: string
          request_id: string
          trigger_type: string
        }
        Update: {
          action_result?: string | null
          action_taken?: string
          created_at?: string
          id?: string
          request_id?: string
          trigger_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_action_logs_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "loss_run_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      carriers: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          loss_run_email: string
          name: string
          phone: string | null
          underwriter_email: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          loss_run_email: string
          name: string
          phone?: string | null
          underwriter_email?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          loss_run_email?: string
          name?: string
          phone?: string | null
          underwriter_email?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      clients: {
        Row: {
          address: string | null
          client_code: string | null
          contact_email: string | null
          contact_phone: string | null
          created_at: string
          created_by: string | null
          id: string
          industry: string | null
          internal_notes: string | null
          name: string
          renewal_date: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          client_code?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          industry?: string | null
          internal_notes?: string | null
          name: string
          renewal_date?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          client_code?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          industry?: string | null
          internal_notes?: string | null
          name?: string
          renewal_date?: string | null
          status?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      email_logs: {
        Row: {
          body: string
          created_by: string | null
          email_type: Database["public"]["Enums"]["email_type"]
          id: string
          recipient: string
          request_id: string
          sent_at: string
          subject: string
        }
        Insert: {
          body: string
          created_by?: string | null
          email_type: Database["public"]["Enums"]["email_type"]
          id?: string
          recipient: string
          request_id: string
          sent_at?: string
          subject: string
        }
        Update: {
          body?: string
          created_by?: string | null
          email_type?: Database["public"]["Enums"]["email_type"]
          id?: string
          recipient?: string
          request_id?: string
          sent_at?: string
          subject?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_logs_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "loss_run_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      interest_signups: {
        Row: {
          created_at: string
          email: string
          id: string
          notes: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          notes?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          notes?: string | null
        }
        Relationships: []
      }
      loss_run_documents: {
        Row: {
          created_at: string
          file_name: string
          file_path: string
          file_size: number | null
          id: string
          mime_type: string | null
          request_id: string
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string
          file_name: string
          file_path: string
          file_size?: number | null
          id?: string
          mime_type?: string | null
          request_id: string
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string
          file_name?: string
          file_path?: string
          file_size?: number | null
          id?: string
          mime_type?: string | null
          request_id?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "loss_run_documents_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "loss_run_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      loss_run_requests: {
        Row: {
          carrier_id: string
          client_id: string
          coverage_type: Database["public"]["Enums"]["coverage_type"]
          created_at: string
          created_by: string | null
          id: string
          notes: string | null
          policy_effective_date: string | null
          policy_expiration_date: string | null
          policy_number: string
          request_date: string
          reviewed_at: string | null
          reviewed_by: string | null
          sent_to_email: string | null
          status: Database["public"]["Enums"]["loss_run_status"]
          updated_at: string
        }
        Insert: {
          carrier_id: string
          client_id: string
          coverage_type: Database["public"]["Enums"]["coverage_type"]
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          policy_effective_date?: string | null
          policy_expiration_date?: string | null
          policy_number: string
          request_date?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          sent_to_email?: string | null
          status?: Database["public"]["Enums"]["loss_run_status"]
          updated_at?: string
        }
        Update: {
          carrier_id?: string
          client_id?: string
          coverage_type?: Database["public"]["Enums"]["coverage_type"]
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          policy_effective_date?: string | null
          policy_expiration_date?: string | null
          policy_number?: string
          request_date?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          sent_to_email?: string | null
          status?: Database["public"]["Enums"]["loss_run_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "loss_run_requests_carrier_id_fkey"
            columns: ["carrier_id"]
            isOneToOne: false
            referencedRelation: "carriers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loss_run_requests_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      policies: {
        Row: {
          carrier_email: string
          carrier_id: string
          client_id: string
          coverage_type: Database["public"]["Enums"]["coverage_type"]
          created_at: string
          created_by: string | null
          effective_date: string | null
          expiration_date: string | null
          id: string
          notes: string | null
          policy_number: string
          updated_at: string
        }
        Insert: {
          carrier_email: string
          carrier_id: string
          client_id: string
          coverage_type: Database["public"]["Enums"]["coverage_type"]
          created_at?: string
          created_by?: string | null
          effective_date?: string | null
          expiration_date?: string | null
          id?: string
          notes?: string | null
          policy_number: string
          updated_at?: string
        }
        Update: {
          carrier_email?: string
          carrier_id?: string
          client_id?: string
          coverage_type?: Database["public"]["Enums"]["coverage_type"]
          created_at?: string
          created_by?: string | null
          effective_date?: string | null
          expiration_date?: string | null
          id?: string
          notes?: string | null
          policy_number?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "policies_carrier_id_fkey"
            columns: ["carrier_id"]
            isOneToOne: false
            referencedRelation: "carriers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "policies_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_authenticated: { Args: never; Returns: boolean }
    }
    Enums: {
      coverage_type:
        | "general_liability"
        | "workers_compensation"
        | "commercial_auto"
        | "commercial_property"
        | "professional_liability"
        | "umbrella"
        | "other"
      email_type: "initial_request" | "follow_up" | "reminder"
      loss_run_status: "requested" | "follow_up_sent" | "received" | "completed"
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
      coverage_type: [
        "general_liability",
        "workers_compensation",
        "commercial_auto",
        "commercial_property",
        "professional_liability",
        "umbrella",
        "other",
      ],
      email_type: ["initial_request", "follow_up", "reminder"],
      loss_run_status: ["requested", "follow_up_sent", "received", "completed"],
    },
  },
} as const
