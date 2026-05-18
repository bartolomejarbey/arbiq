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
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      analytics_events: {
        Row: {
          created_at: string
          event: string
          id: number
          ip_hash: string | null
          page: string | null
          props: Json | null
          referrer: string | null
          session_id: string | null
          user_agent: string | null
          utm_campaign: string | null
          utm_medium: string | null
          utm_source: string | null
          visitor_id: string | null
        }
        Insert: {
          created_at?: string
          event: string
          id?: number
          ip_hash?: string | null
          page?: string | null
          props?: Json | null
          referrer?: string | null
          session_id?: string | null
          user_agent?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          visitor_id?: string | null
        }
        Update: {
          created_at?: string
          event?: string
          id?: number
          ip_hash?: string | null
          page?: string | null
          props?: Json | null
          referrer?: string | null
          session_id?: string | null
          user_agent?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          visitor_id?: string | null
        }
        Relationships: []
      }
      app_settings: {
        Row: {
          key: string
          updated_at: string
          value: string | null
        }
        Insert: {
          key: string
          updated_at?: string
          value?: string | null
        }
        Update: {
          key?: string
          updated_at?: string
          value?: string | null
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          model: string | null
          role: string
          session_id: string
          tokens_in: number | null
          tokens_out: number | null
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          model?: string | null
          role: string
          session_id: string
          tokens_in?: number | null
          tokens_out?: number | null
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          model?: string | null
          role?: string
          session_id?: string
          tokens_in?: number | null
          tokens_out?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "chat_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_sessions: {
        Row: {
          conversion_kind: string | null
          converted_at: string | null
          id: string
          ip_hash: string | null
          last_message_at: string
          message_count: number
          page_path: string | null
          started_at: string
          user_agent: string | null
          utm_campaign: string | null
          utm_medium: string | null
          utm_source: string | null
          visitor_id: string | null
        }
        Insert: {
          conversion_kind?: string | null
          converted_at?: string | null
          id?: string
          ip_hash?: string | null
          last_message_at?: string
          message_count?: number
          page_path?: string | null
          started_at?: string
          user_agent?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          visitor_id?: string | null
        }
        Update: {
          conversion_kind?: string | null
          converted_at?: string | null
          id?: string
          ip_hash?: string | null
          last_message_at?: string
          message_count?: number
          page_path?: string | null
          started_at?: string
          user_agent?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          visitor_id?: string | null
        }
        Relationships: []
      }
      contact_messages: {
        Row: {
          created_at: string
          email: string
          id: string
          message: string
          name: string
          phone: string | null
          source_tag: string | null
          status: string
          type: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          message: string
          name: string
          phone?: string | null
          source_tag?: string | null
          status?: string
          type?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          message?: string
          name?: string
          phone?: string | null
          source_tag?: string | null
          status?: string
          type?: string
        }
        Relationships: []
      }
      contracts: {
        Row: {
          client_id: string
          contract_number: string
          created_at: string
          currency: string
          deadline_days: number | null
          deposit_percent: number | null
          docx_url: string | null
          exclusivity_clause: string | null
          has_exclusivity: boolean
          has_nda: boolean
          hourly_rate: number | null
          id: string
          kind: string
          late_fee_per_day: number | null
          metadata: Json | null
          monthly_fee: number | null
          nda_penalty: number | null
          obchodnik_id: string | null
          pdf_url: string | null
          penalty_max: number | null
          place_of_signing: string | null
          project_id: string | null
          scope_bullets: Json | null
          scope_html: string | null
          signed_at_customer: string | null
          signed_at_supplier: string | null
          status: string
          subject: string
          title: string
          total_price: number
          updated_at: string
          vat_note: string | null
          warranty_months: number | null
        }
        Insert: {
          client_id: string
          contract_number: string
          created_at?: string
          currency?: string
          deadline_days?: number | null
          deposit_percent?: number | null
          docx_url?: string | null
          exclusivity_clause?: string | null
          has_exclusivity?: boolean
          has_nda?: boolean
          hourly_rate?: number | null
          id?: string
          kind?: string
          late_fee_per_day?: number | null
          metadata?: Json | null
          monthly_fee?: number | null
          nda_penalty?: number | null
          obchodnik_id?: string | null
          pdf_url?: string | null
          penalty_max?: number | null
          place_of_signing?: string | null
          project_id?: string | null
          scope_bullets?: Json | null
          scope_html?: string | null
          signed_at_customer?: string | null
          signed_at_supplier?: string | null
          status?: string
          subject: string
          title: string
          total_price: number
          updated_at?: string
          vat_note?: string | null
          warranty_months?: number | null
        }
        Update: {
          client_id?: string
          contract_number?: string
          created_at?: string
          currency?: string
          deadline_days?: number | null
          deposit_percent?: number | null
          docx_url?: string | null
          exclusivity_clause?: string | null
          has_exclusivity?: boolean
          has_nda?: boolean
          hourly_rate?: number | null
          id?: string
          kind?: string
          late_fee_per_day?: number | null
          metadata?: Json | null
          monthly_fee?: number | null
          nda_penalty?: number | null
          obchodnik_id?: string | null
          pdf_url?: string | null
          penalty_max?: number | null
          place_of_signing?: string | null
          project_id?: string | null
          scope_bullets?: Json | null
          scope_html?: string | null
          signed_at_customer?: string | null
          signed_at_supplier?: string | null
          status?: string
          subject?: string
          title?: string
          total_price?: number
          updated_at?: string
          vat_note?: string | null
          warranty_months?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "contracts_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_obchodnik_id_fkey"
            columns: ["obchodnik_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      cookie_consent_log: {
        Row: {
          analytics: boolean
          anon_id: string
          created_at: string
          id: number
          ip_hash: string | null
          marketing: boolean
          necessary: boolean
          source: string | null
          user_agent: string | null
        }
        Insert: {
          analytics?: boolean
          anon_id: string
          created_at?: string
          id?: number
          ip_hash?: string | null
          marketing?: boolean
          necessary?: boolean
          source?: string | null
          user_agent?: string | null
        }
        Update: {
          analytics?: boolean
          anon_id?: string
          created_at?: string
          id?: number
          ip_hash?: string | null
          marketing?: boolean
          necessary?: boolean
          source?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      crm_contacts: {
        Row: {
          client_id: string
          created_at: string
          id: string
          next_followup: string | null
          note: string
          obchodnik_id: string
          type: string
        }
        Insert: {
          client_id: string
          created_at?: string
          id?: string
          next_followup?: string | null
          note: string
          obchodnik_id: string
          type: string
        }
        Update: {
          client_id?: string
          created_at?: string
          id?: string
          next_followup?: string | null
          note?: string
          obchodnik_id?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_contacts_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_contacts_obchodnik_id_fkey"
            columns: ["obchodnik_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_notes: {
        Row: {
          author_id: string
          client_id: string | null
          content: string
          created_at: string
          id: string
          lead_id: string | null
        }
        Insert: {
          author_id: string
          client_id?: string | null
          content: string
          created_at?: string
          id?: string
          lead_id?: string | null
        }
        Update: {
          author_id?: string
          client_id?: string | null
          content?: string
          created_at?: string
          id?: string
          lead_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_notes_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_notes_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_notes_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "landing_leads"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_tasks: {
        Row: {
          assigned_to: string
          client_id: string | null
          completed_at: string | null
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          lead_id: string | null
          priority: string
          status: string
          title: string
        }
        Insert: {
          assigned_to: string
          client_id?: string | null
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          lead_id?: string | null
          priority?: string
          status?: string
          title: string
        }
        Update: {
          assigned_to?: string
          client_id?: string | null
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          lead_id?: string | null
          priority?: string
          status?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_tasks_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_tasks_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_tasks_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "landing_leads"
            referencedColumns: ["id"]
          },
        ]
      }
      databaze_kontaktu: {
        Row: {
          assigned_to: string | null
          company: string | null
          contacted: boolean
          contacted_at: string | null
          contacted_by: string | null
          created_at: string
          email: string | null
          full_name: string
          ico: string | null
          id: string
          imported_lead_id: string | null
          imported_to_leads: boolean
          industry: string | null
          notes: string | null
          outcome: string | null
          outcome_at: string | null
          phone: string | null
          position: string | null
          source: string | null
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          company?: string | null
          contacted?: boolean
          contacted_at?: string | null
          contacted_by?: string | null
          created_at?: string
          email?: string | null
          full_name: string
          ico?: string | null
          id?: string
          imported_lead_id?: string | null
          imported_to_leads?: boolean
          industry?: string | null
          notes?: string | null
          outcome?: string | null
          outcome_at?: string | null
          phone?: string | null
          position?: string | null
          source?: string | null
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          company?: string | null
          contacted?: boolean
          contacted_at?: string | null
          contacted_by?: string | null
          created_at?: string
          email?: string | null
          full_name?: string
          ico?: string | null
          id?: string
          imported_lead_id?: string | null
          imported_to_leads?: boolean
          industry?: string | null
          notes?: string | null
          outcome?: string | null
          outcome_at?: string | null
          phone?: string | null
          position?: string | null
          source?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "databaze_kontaktu_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "databaze_kontaktu_contacted_by_fkey"
            columns: ["contacted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "databaze_kontaktu_imported_lead_id_fkey"
            columns: ["imported_lead_id"]
            isOneToOne: false
            referencedRelation: "landing_leads"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          client_id: string | null
          contract_id: string | null
          created_at: string
          file_path: string
          file_size: number | null
          id: string
          invoice_id: string | null
          mime_type: string | null
          name: string
          project_id: string | null
          storage_path: string | null
          title: string | null
          type: string
          uploaded_by: string | null
        }
        Insert: {
          client_id?: string | null
          contract_id?: string | null
          created_at?: string
          file_path: string
          file_size?: number | null
          id?: string
          invoice_id?: string | null
          mime_type?: string | null
          name: string
          project_id?: string | null
          storage_path?: string | null
          title?: string | null
          type?: string
          uploaded_by?: string | null
        }
        Update: {
          client_id?: string | null
          contract_id?: string | null
          created_at?: string
          file_path?: string
          file_size?: number | null
          id?: string
          invoice_id?: string | null
          mime_type?: string | null
          name?: string
          project_id?: string | null
          storage_path?: string | null
          title?: string | null
          type?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "documents_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      event_sync_log: {
        Row: {
          action: string
          direction: string
          error: string | null
          event_id: string | null
          id: number
          occurred_at: string
          request_payload: Json | null
          response_payload: Json | null
          status: string
          user_id: string | null
        }
        Insert: {
          action: string
          direction: string
          error?: string | null
          event_id?: string | null
          id?: number
          occurred_at?: string
          request_payload?: Json | null
          response_payload?: Json | null
          status: string
          user_id?: string | null
        }
        Update: {
          action?: string
          direction?: string
          error?: string | null
          event_id?: string | null
          id?: number
          occurred_at?: string
          request_payload?: Json | null
          response_payload?: Json | null
          status?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_sync_log_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_sync_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          all_day: boolean
          attendees: Json
          client_id: string | null
          conference_data: Json | null
          created_at: string
          deleted_at: string | null
          description: string | null
          end_at: string
          etag: string | null
          google_calendar_id: string | null
          google_event_id: string | null
          id: string
          last_synced_at: string | null
          lead_id: string | null
          location: string | null
          meet_link: string | null
          owner_id: string
          project_id: string | null
          start_at: string
          sync_error: string | null
          sync_status: string
          timezone: string
          title: string
          updated_at: string
          visibility: string
        }
        Insert: {
          all_day?: boolean
          attendees?: Json
          client_id?: string | null
          conference_data?: Json | null
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          end_at: string
          etag?: string | null
          google_calendar_id?: string | null
          google_event_id?: string | null
          id?: string
          last_synced_at?: string | null
          lead_id?: string | null
          location?: string | null
          meet_link?: string | null
          owner_id: string
          project_id?: string | null
          start_at: string
          sync_error?: string | null
          sync_status?: string
          timezone?: string
          title: string
          updated_at?: string
          visibility?: string
        }
        Update: {
          all_day?: boolean
          attendees?: Json
          client_id?: string | null
          conference_data?: Json | null
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          end_at?: string
          etag?: string | null
          google_calendar_id?: string | null
          google_event_id?: string | null
          id?: string
          last_synced_at?: string | null
          lead_id?: string | null
          location?: string | null
          meet_link?: string | null
          owner_id?: string
          project_id?: string | null
          start_at?: string
          sync_error?: string | null
          sync_status?: string
          timezone?: string
          title?: string
          updated_at?: string
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "landing_leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      google_oauth_connections: {
        Row: {
          access_token: string | null
          access_token_expires_at: string | null
          calendar_id: string
          created_at: string
          encrypted_refresh_token: string
          google_user_email: string
          last_error: string | null
          last_sync_at: string | null
          status: string
          sync_token: string | null
          updated_at: string
          user_id: string
          watch_channel_id: string | null
          watch_expires_at: string | null
          watch_resource_id: string | null
        }
        Insert: {
          access_token?: string | null
          access_token_expires_at?: string | null
          calendar_id?: string
          created_at?: string
          encrypted_refresh_token: string
          google_user_email: string
          last_error?: string | null
          last_sync_at?: string | null
          status?: string
          sync_token?: string | null
          updated_at?: string
          user_id: string
          watch_channel_id?: string | null
          watch_expires_at?: string | null
          watch_resource_id?: string | null
        }
        Update: {
          access_token?: string | null
          access_token_expires_at?: string | null
          calendar_id?: string
          created_at?: string
          encrypted_refresh_token?: string
          google_user_email?: string
          last_error?: string | null
          last_sync_at?: string | null
          status?: string
          sync_token?: string | null
          updated_at?: string
          user_id?: string
          watch_channel_id?: string | null
          watch_expires_at?: string | null
          watch_resource_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "google_oauth_connections_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          amount: number
          client_id: string
          constant_symbol: string | null
          contract_id: string | null
          created_at: string
          currency: string
          description: string | null
          due_date: string
          id: string
          invoice_number: string
          issued_at: string
          items: Json | null
          kind: string
          paid_at: string | null
          payment_method: string
          pdf_url: string | null
          project_id: string | null
          qr_payload: string | null
          status: string
          variable_symbol: string | null
        }
        Insert: {
          amount: number
          client_id: string
          constant_symbol?: string | null
          contract_id?: string | null
          created_at?: string
          currency?: string
          description?: string | null
          due_date: string
          id?: string
          invoice_number: string
          issued_at?: string
          items?: Json | null
          kind?: string
          paid_at?: string | null
          payment_method?: string
          pdf_url?: string | null
          project_id?: string | null
          qr_payload?: string | null
          status?: string
          variable_symbol?: string | null
        }
        Update: {
          amount?: number
          client_id?: string
          constant_symbol?: string | null
          contract_id?: string | null
          created_at?: string
          currency?: string
          description?: string | null
          due_date?: string
          id?: string
          invoice_number?: string
          issued_at?: string
          items?: Json | null
          kind?: string
          paid_at?: string | null
          payment_method?: string
          pdf_url?: string | null
          project_id?: string | null
          qr_payload?: string | null
          status?: string
          variable_symbol?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_contract_fk"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      landing_leads: {
        Row: {
          assigned_to: string | null
          budget: string | null
          case_number: string | null
          converted_to_client: string | null
          created_at: string
          email: string
          id: string
          kampan: string
          name: string
          notes: string | null
          obor: string | null
          phone: string | null
          pipeline_stage: string
          popis: string | null
          source_tag: string | null
          status: string
          step3_odpoved: string | null
          utm_campaign: string | null
          utm_medium: string | null
          utm_source: string | null
          velikost_firmy: string | null
          wants: Json | null
          website_url: string | null
        }
        Insert: {
          assigned_to?: string | null
          budget?: string | null
          case_number?: string | null
          converted_to_client?: string | null
          created_at?: string
          email: string
          id?: string
          kampan: string
          name: string
          notes?: string | null
          obor?: string | null
          phone?: string | null
          pipeline_stage?: string
          popis?: string | null
          source_tag?: string | null
          status?: string
          step3_odpoved?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          velikost_firmy?: string | null
          wants?: Json | null
          website_url?: string | null
        }
        Update: {
          assigned_to?: string | null
          budget?: string | null
          case_number?: string | null
          converted_to_client?: string | null
          created_at?: string
          email?: string
          id?: string
          kampan?: string
          name?: string
          notes?: string | null
          obor?: string | null
          phone?: string | null
          pipeline_stage?: string
          popis?: string | null
          source_tag?: string | null
          status?: string
          step3_odpoved?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          velikost_firmy?: string | null
          wants?: Json | null
          website_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "landing_leads_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "landing_leads_converted_to_client_fkey"
            columns: ["converted_to_client"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          author_id: string
          content: string
          created_at: string
          id: string
          is_internal: boolean
          project_id: string
          read_at: string | null
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string
          id?: string
          is_internal?: boolean
          project_id: string
          read_at?: string | null
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string
          id?: string
          is_internal?: boolean
          project_id?: string
          read_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      metrics: {
        Row: {
          client_id: string
          created_at: string
          id: string
          metric: string
          metric_label: string | null
          recorded_for: string
          value: number
        }
        Insert: {
          client_id: string
          created_at?: string
          id?: string
          metric: string
          metric_label?: string | null
          recorded_for: string
          value: number
        }
        Update: {
          client_id?: string
          created_at?: string
          id?: string
          metric?: string
          metric_label?: string | null
          recorded_for?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "metrics_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      milestones: {
        Row: {
          completed_at: string | null
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          name: string
          project_id: string
          sort_order: number
          status: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          name: string
          project_id: string
          sort_order?: number
          status?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          name?: string
          project_id?: string
          sort_order?: number
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "milestones_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          assigned_obchodnik: string | null
          avatar_url: string | null
          city: string | null
          company: string | null
          created_at: string
          dic: string | null
          email: string
          email_notifications_enabled: boolean
          full_name: string
          ico: string | null
          id: string
          is_active: boolean
          notes: string | null
          phone: string | null
          representative_name: string | null
          role: string
          street: string | null
          updated_at: string
          website_url: string | null
        }
        Insert: {
          assigned_obchodnik?: string | null
          avatar_url?: string | null
          city?: string | null
          company?: string | null
          created_at?: string
          dic?: string | null
          email: string
          email_notifications_enabled?: boolean
          full_name: string
          ico?: string | null
          id: string
          is_active?: boolean
          notes?: string | null
          phone?: string | null
          representative_name?: string | null
          role?: string
          street?: string | null
          updated_at?: string
          website_url?: string | null
        }
        Update: {
          assigned_obchodnik?: string | null
          avatar_url?: string | null
          city?: string | null
          company?: string | null
          created_at?: string
          dic?: string | null
          email?: string
          email_notifications_enabled?: boolean
          full_name?: string
          ico?: string | null
          id?: string
          is_active?: boolean
          notes?: string | null
          phone?: string | null
          representative_name?: string | null
          role?: string
          street?: string | null
          updated_at?: string
          website_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_assigned_obchodnik_fkey"
            columns: ["assigned_obchodnik"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          actual_end_date: string | null
          client_id: string
          created_at: string
          description: string | null
          estimated_end_date: string | null
          id: string
          name: string
          notes: string | null
          obchodnik_id: string | null
          progress: number
          start_date: string | null
          status: string
          total_value: number | null
          updated_at: string
        }
        Insert: {
          actual_end_date?: string | null
          client_id: string
          created_at?: string
          description?: string | null
          estimated_end_date?: string | null
          id?: string
          name: string
          notes?: string | null
          obchodnik_id?: string | null
          progress?: number
          start_date?: string | null
          status?: string
          total_value?: number | null
          updated_at?: string
        }
        Update: {
          actual_end_date?: string | null
          client_id?: string
          created_at?: string
          description?: string | null
          estimated_end_date?: string | null
          id?: string
          name?: string
          notes?: string | null
          obchodnik_id?: string | null
          progress?: number
          start_date?: string | null
          status?: string
          total_value?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_obchodnik_id_fkey"
            columns: ["obchodnik_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      recommendations: {
        Row: {
          client_id: string
          created_at: string
          created_by: string
          description: string
          estimated_price: string | null
          id: string
          interested_at: string | null
          service_name: string
          status: string
        }
        Insert: {
          client_id: string
          created_at?: string
          created_by: string
          description: string
          estimated_price?: string | null
          id?: string
          interested_at?: string | null
          service_name: string
          status?: string
        }
        Update: {
          client_id?: string
          created_at?: string
          created_by?: string
          description?: string
          estimated_price?: string | null
          id?: string
          interested_at?: string | null
          service_name?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "recommendations_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recommendations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      rentgen_orders: {
        Row: {
          assigned_to: string | null
          company: string | null
          created_at: string
          delivered_at: string | null
          email: string
          id: string
          name: string
          paid_at: string | null
          phone: string | null
          problem_description: string | null
          source_tag: string | null
          status: string
          utm_campaign: string | null
          utm_medium: string | null
          utm_source: string | null
          website_url: string
        }
        Insert: {
          assigned_to?: string | null
          company?: string | null
          created_at?: string
          delivered_at?: string | null
          email: string
          id?: string
          name: string
          paid_at?: string | null
          phone?: string | null
          problem_description?: string | null
          source_tag?: string | null
          status?: string
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          website_url: string
        }
        Update: {
          assigned_to?: string | null
          company?: string | null
          created_at?: string
          delivered_at?: string | null
          email?: string
          id?: string
          name?: string
          paid_at?: string | null
          phone?: string | null
          problem_description?: string | null
          source_tag?: string | null
          status?: string
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          website_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "rentgen_orders_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      bump_chat_session: { Args: { s_id: string }; Returns: undefined }
      decrypt_with_key: {
        Args: { encrypted: string; key: string }
        Returns: string
      }
      dismiss_recommendation: { Args: { rec_id: string }; Returns: undefined }
      encrypt_with_key: {
        Args: { key: string; token: string }
        Returns: string
      }
      is_admin: { Args: never; Returns: boolean }
      is_my_client: { Args: { client: string }; Returns: boolean }
      is_obchodnik_or_admin: { Args: never; Returns: boolean }
      mark_recommendation_interested: {
        Args: { rec_id: string }
        Returns: undefined
      }
      next_case_number: { Args: never; Returns: string }
      next_contract_number: { Args: never; Returns: string }
      next_invoice_number: { Args: never; Returns: string }
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const
