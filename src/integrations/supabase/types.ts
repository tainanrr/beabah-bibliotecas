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
      // Definições de turnos do sistema
      shift_definitions: {
        Row: {
          id: string
          name: string // 'morning', 'afternoon', 'evening'
          label: string // 'Manhã', 'Tarde', 'Noite'
          start_time: string
          end_time: string
          display_order: number
          active: boolean
          created_at: string | null
        }
        Insert: {
          id?: string
          name: string
          label: string
          start_time: string
          end_time: string
          display_order?: number
          active?: boolean
          created_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          label?: string
          start_time?: string
          end_time?: string
          display_order?: number
          active?: boolean
          created_at?: string | null
        }
        Relationships: []
      }
      // Agenda prevista de abertura por biblioteca
      library_expected_schedule: {
        Row: {
          id: string
          library_id: string
          day_of_week: number // 0=Dom, 1=Seg, ..., 6=Sab
          shift_name: string // 'morning', 'afternoon', 'evening'
          is_open: boolean
          custom_start_time: string | null
          custom_end_time: string | null
          notes: string | null
          created_at: string | null
          updated_at: string | null
          created_by: string | null
        }
        Insert: {
          id?: string
          library_id: string
          day_of_week: number
          shift_name?: string
          is_open?: boolean
          custom_start_time?: string | null
          custom_end_time?: string | null
          notes?: string | null
          created_at?: string | null
          updated_at?: string | null
          created_by?: string | null
        }
        Update: {
          id?: string
          library_id?: string
          day_of_week?: number
          shift_name?: string
          is_open?: boolean
          custom_start_time?: string | null
          custom_end_time?: string | null
          notes?: string | null
          created_at?: string | null
          updated_at?: string | null
          created_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "library_expected_schedule_library_id_fkey"
            columns: ["library_id"]
            isOneToOne: false
            referencedRelation: "libraries"
            referencedColumns: ["id"]
          }
        ]
      }
      // Cadastro de feriados
      holidays: {
        Row: {
          id: string
          name: string
          date: string
          recurring: boolean
          national: boolean
          library_id: string | null
          active: boolean
          created_at: string | null
          created_by: string | null
        }
        Insert: {
          id?: string
          name: string
          date: string
          recurring?: boolean
          national?: boolean
          library_id?: string | null
          active?: boolean
          created_at?: string | null
          created_by?: string | null
        }
        Update: {
          id?: string
          name?: string
          date?: string
          recurring?: boolean
          national?: boolean
          library_id?: string | null
          active?: boolean
          created_at?: string | null
          created_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "holidays_library_id_fkey"
            columns: ["library_id"]
            isOneToOne: false
            referencedRelation: "libraries"
            referencedColumns: ["id"]
          }
        ]
      }
      // Tabelas do Monitoramento Beabah!
      library_opening_schedule: {
        Row: {
          id: string
          library_id: string
          day_of_week: number
          opening_time: string | null
          closing_time: string | null
          is_open: boolean
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          library_id: string
          day_of_week: number
          opening_time?: string | null
          closing_time?: string | null
          is_open?: boolean
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          library_id?: string
          day_of_week?: number
          opening_time?: string | null
          closing_time?: string | null
          is_open?: boolean
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "library_opening_schedule_library_id_fkey"
            columns: ["library_id"]
            isOneToOne: false
            referencedRelation: "libraries"
            referencedColumns: ["id"]
          }
        ]
      }
      library_opening_log: {
        Row: {
          id: string
          library_id: string
          date: string
          shift_name: string // 'morning', 'afternoon', 'evening', 'full_day'
          opened: boolean
          opening_time: string | null
          closing_time: string | null
          notes: string | null
          staff_names: string | null
          created_by: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          library_id: string
          date: string
          shift_name?: string
          opened?: boolean
          opening_time?: string | null
          closing_time?: string | null
          notes?: string | null
          staff_names?: string | null
          created_by?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          library_id?: string
          date?: string
          shift_name?: string
          opened?: boolean
          opening_time?: string | null
          closing_time?: string | null
          notes?: string | null
          staff_names?: string | null
          created_by?: string | null
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "library_opening_log_library_id_fkey"
            columns: ["library_id"]
            isOneToOne: false
            referencedRelation: "libraries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "library_opening_log_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users_profile"
            referencedColumns: ["id"]
          }
        ]
      }
      reading_mediations: {
        Row: {
          id: string
          library_id: string
          date: string
          mediation_type: string
          location: string | null
          audience_count: number
          virtual_views: number
          literary_genres: string[] | null
          post_mediation_notes: string | null
          description: string | null
          created_by: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          library_id: string
          date: string
          mediation_type: string
          location?: string | null
          audience_count?: number
          virtual_views?: number
          literary_genres?: string[] | null
          post_mediation_notes?: string | null
          description?: string | null
          created_by?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          library_id?: string
          date?: string
          mediation_type?: string
          location?: string | null
          audience_count?: number
          virtual_views?: number
          literary_genres?: string[] | null
          post_mediation_notes?: string | null
          description?: string | null
          created_by?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reading_mediations_library_id_fkey"
            columns: ["library_id"]
            isOneToOne: false
            referencedRelation: "libraries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reading_mediations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users_profile"
            referencedColumns: ["id"]
          }
        ]
      }
      technical_processing: {
        Row: {
          id: string
          library_id: string
          date: string
          books_purchased: number
          books_donated: number
          books_cataloged: number
          books_classified: number
          books_indexed: number
          books_stamped: number
          books_consulted: number
          reading_bags_distributed: number
          other_donations: string | null
          notes: string | null
          created_by: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          library_id: string
          date: string
          books_purchased?: number
          books_donated?: number
          books_cataloged?: number
          books_classified?: number
          books_indexed?: number
          books_stamped?: number
          books_consulted?: number
          reading_bags_distributed?: number
          other_donations?: string | null
          notes?: string | null
          created_by?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          library_id?: string
          date?: string
          books_purchased?: number
          books_donated?: number
          books_cataloged?: number
          books_classified?: number
          books_indexed?: number
          books_stamped?: number
          books_consulted?: number
          reading_bags_distributed?: number
          other_donations?: string | null
          notes?: string | null
          created_by?: string | null
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "technical_processing_library_id_fkey"
            columns: ["library_id"]
            isOneToOne: false
            referencedRelation: "libraries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "technical_processing_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users_profile"
            referencedColumns: ["id"]
          }
        ]
      }
      monthly_reports: {
        Row: {
          id: string
          library_id: string
          month: number
          year: number
          contact_email: string | null
          staff_names: string | null
          days_opened: number
          opening_schedule: string | null
          fixed_days: string[] | null
          total_presential_mediations: number
          total_virtual_mediations: number
          mediations_at_library: number
          mediations_external: string | null
          literary_genres: string[] | null
          total_mediation_audience: number
          total_virtual_views: number
          had_cultural_actions: boolean
          total_cultural_actions: number
          cultural_actions_details: any | null
          cultural_actions_notes: string | null
          total_cultural_audience: number
          partner_activities: string | null
          management_highlights: string | null
          space_changes: string[] | null
          collection_changes: string[] | null
          other_donations: string | null
          books_purchased: number
          books_donated: number
          books_cataloged: number
          books_classified: number
          books_indexed: number
          books_stamped: number
          total_loans: number
          reading_bags: number
          books_consulted: number
          new_readers: number
          status: string
          submitted_at: string | null
          created_by: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          library_id: string
          month: number
          year: number
          contact_email?: string | null
          staff_names?: string | null
          days_opened?: number
          opening_schedule?: string | null
          fixed_days?: string[] | null
          total_presential_mediations?: number
          total_virtual_mediations?: number
          mediations_at_library?: number
          mediations_external?: string | null
          literary_genres?: string[] | null
          total_mediation_audience?: number
          total_virtual_views?: number
          had_cultural_actions?: boolean
          total_cultural_actions?: number
          cultural_actions_details?: any | null
          cultural_actions_notes?: string | null
          total_cultural_audience?: number
          partner_activities?: string | null
          management_highlights?: string | null
          space_changes?: string[] | null
          collection_changes?: string[] | null
          other_donations?: string | null
          books_purchased?: number
          books_donated?: number
          books_cataloged?: number
          books_classified?: number
          books_indexed?: number
          books_stamped?: number
          total_loans?: number
          reading_bags?: number
          books_consulted?: number
          new_readers?: number
          status?: string
          submitted_at?: string | null
          created_by?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          library_id?: string
          month?: number
          year?: number
          contact_email?: string | null
          staff_names?: string | null
          days_opened?: number
          opening_schedule?: string | null
          fixed_days?: string[] | null
          total_presential_mediations?: number
          total_virtual_mediations?: number
          mediations_at_library?: number
          mediations_external?: string | null
          literary_genres?: string[] | null
          total_mediation_audience?: number
          total_virtual_views?: number
          had_cultural_actions?: boolean
          total_cultural_actions?: number
          cultural_actions_details?: any | null
          cultural_actions_notes?: string | null
          total_cultural_audience?: number
          partner_activities?: string | null
          management_highlights?: string | null
          space_changes?: string[] | null
          collection_changes?: string[] | null
          other_donations?: string | null
          books_purchased?: number
          books_donated?: number
          books_cataloged?: number
          books_classified?: number
          books_indexed?: number
          books_stamped?: number
          total_loans?: number
          reading_bags?: number
          books_consulted?: number
          new_readers?: number
          status?: string
          submitted_at?: string | null
          created_by?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "monthly_reports_library_id_fkey"
            columns: ["library_id"]
            isOneToOne: false
            referencedRelation: "libraries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "monthly_reports_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users_profile"
            referencedColumns: ["id"]
          }
        ]
      }
      books: {
        Row: {
          author: string
          category: string | null
          created_at: string | null
          id: string
          isbn: string | null
          title: string
        }
        Insert: {
          author: string
          category?: string | null
          created_at?: string | null
          id?: string
          isbn?: string | null
          title: string
        }
        Update: {
          author?: string
          category?: string | null
          created_at?: string | null
          id?: string
          isbn?: string | null
          title?: string
        }
        Relationships: []
      }
      copies: {
        Row: {
          book_id: string
          code: string
          id: string
          library_id: string
          status: string | null
        }
        Insert: {
          book_id: string
          code: string
          id?: string
          library_id: string
          status?: string | null
        }
        Update: {
          book_id?: string
          code?: string
          id?: string
          library_id?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "copies_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "copies_library_id_fkey"
            columns: ["library_id"]
            isOneToOne: false
            referencedRelation: "libraries"
            referencedColumns: ["id"]
          },
        ]
      }
      libraries: {
        Row: {
          active: boolean | null
          city: string
          created_at: string | null
          id: string
          name: string
        }
        Insert: {
          active?: boolean | null
          city: string
          created_at?: string | null
          id?: string
          name: string
        }
        Update: {
          active?: boolean | null
          city?: string
          created_at?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      loans: {
        Row: {
          copy_id: string
          created_at: string | null
          due_date: string
          id: string
          library_id: string
          loan_date: string | null
          return_date: string | null
          status: string | null
          user_id: string
        }
        Insert: {
          copy_id: string
          created_at?: string | null
          due_date: string
          id?: string
          library_id: string
          loan_date?: string | null
          return_date?: string | null
          status?: string | null
          user_id: string
        }
        Update: {
          copy_id?: string
          created_at?: string | null
          due_date?: string
          id?: string
          library_id?: string
          loan_date?: string | null
          return_date?: string | null
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "loans_copy_id_fkey"
            columns: ["copy_id"]
            isOneToOne: false
            referencedRelation: "copies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loans_library_id_fkey"
            columns: ["library_id"]
            isOneToOne: false
            referencedRelation: "libraries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loans_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_profile"
            referencedColumns: ["id"]
          },
        ]
      }
      users_profile: {
        Row: {
          active: boolean | null
          blocked_until: string | null
          created_at: string | null
          email: string
          id: string
          lgpd_consent: boolean | null
          library_id: string | null
          name: string
          role: string
          // Novos campos para dados completos de leitores
          birth_date: string | null
          phone: string | null
          address_street: string | null
          address_neighborhood: string | null
          address_city: string | null
          ethnicity: string | null
          gender: string | null
          education_level: string | null
          interests: string | null
          favorite_genres: string | null
          suggestions: string | null
          original_registration_date: string | null
          notes: string | null
        }
        Insert: {
          active?: boolean | null
          blocked_until?: string | null
          created_at?: string | null
          email: string
          id?: string
          lgpd_consent?: boolean | null
          library_id?: string | null
          name: string
          role: string
          // Novos campos para dados completos de leitores
          birth_date?: string | null
          phone?: string | null
          address_street?: string | null
          address_neighborhood?: string | null
          address_city?: string | null
          ethnicity?: string | null
          gender?: string | null
          education_level?: string | null
          interests?: string | null
          favorite_genres?: string | null
          suggestions?: string | null
          original_registration_date?: string | null
          notes?: string | null
        }
        Update: {
          active?: boolean | null
          blocked_until?: string | null
          created_at?: string | null
          email?: string
          id?: string
          lgpd_consent?: boolean | null
          library_id?: string | null
          name?: string
          role?: string
          // Novos campos para dados completos de leitores
          birth_date?: string | null
          phone?: string | null
          address_street?: string | null
          address_neighborhood?: string | null
          address_city?: string | null
          ethnicity?: string | null
          gender?: string | null
          education_level?: string | null
          interests?: string | null
          favorite_genres?: string | null
          suggestions?: string | null
          original_registration_date?: string | null
          notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "users_profile_library_id_fkey"
            columns: ["library_id"]
            isOneToOne: false
            referencedRelation: "libraries"
            referencedColumns: ["id"]
          },
        ]
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
