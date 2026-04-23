/**
 * Permissive placeholder for the generated Supabase Database type.
 *
 * Replace this file once the Supabase project is live by running:
 *
 *   npx supabase login
 *   npx supabase link --project-ref <YOUR_REF>
 *   npx supabase gen types typescript --linked > lib/types/database.ts
 *
 * Until then, queries are typed as `Record<string, unknown>` — runtime
 * still works, but you lose IntelliSense on rows.
 */

type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      [key: string]: {
        Row: Record<string, Json>;
        Insert: Record<string, Json>;
        Update: Record<string, Json>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      next_case_number: { Args: Record<string, never>; Returns: string };
      next_invoice_number: { Args: Record<string, never>; Returns: string };
      mark_recommendation_interested: { Args: { rec_id: string }; Returns: void };
      dismiss_recommendation: { Args: { rec_id: string }; Returns: void };
      is_admin: { Args: Record<string, never>; Returns: boolean };
      is_obchodnik_or_admin: { Args: Record<string, never>; Returns: boolean };
      is_my_client: { Args: { client: string }; Returns: boolean };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

export type UserRole = 'klient' | 'obchodnik' | 'admin';

export type ProjectStatus =
  | 'novy'
  | 'v_priprave'
  | 've_vyvoji'
  | 'k_revizi'
  | 'dokoncen'
  | 'pozastaven'
  | 'zruseny';

export type MilestoneStatus = 'ceka' | 'aktivni' | 'dokoncen' | 'preskocen';

export type InvoiceStatus = 'ceka' | 'zaplaceno' | 'po_splatnosti' | 'zruseno';

export type LeadStatus =
  | 'new'
  | 'contacted'
  | 'qualified'
  | 'unqualified'
  | 'converted'
  | 'lost';

export type RentgenStatus =
  | 'new'
  | 'paid'
  | 'in_progress'
  | 'delivered'
  | 'cancelled';

export type RecommendationStatus =
  | 'nova'
  | 'zobrazena'
  | 'zajem'
  | 'odmitnuta'
  | 'realizovana';

export type TaskPriority = 'low' | 'normal' | 'high' | 'urgent';
export type TaskStatus = 'todo' | 'in_progress' | 'done' | 'cancelled';

export type ContactType = 'telefon' | 'email' | 'schuzka' | 'zprava' | 'jine';
