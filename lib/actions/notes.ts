'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

const NoteContentSchema = z.string().trim().min(1, 'Poznámka nesmí být prázdná.').max(4000, 'Poznámka je moc dlouhá (max 4000 znaků).');
const UuidSchema = z.string().uuid();

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Nepřihlášený uživatel.');
  return { supabase, user };
}

export type NoteActionResult = { ok: true } | { ok: false; error: string };

export async function addLeadNote(formData: FormData): Promise<NoteActionResult> {
  let leadId: string;
  let content: string;
  try {
    leadId = UuidSchema.parse(formData.get('lead_id'));
    content = NoteContentSchema.parse(formData.get('content'));
  } catch (err) {
    return {
      ok: false,
      error: err instanceof z.ZodError ? err.issues.map((i) => i.message).join(', ') : 'Neplatná data.',
    };
  }

  try {
    const { supabase, user } = await requireUser();
    const { error } = await supabase
      .from('crm_notes')
      .insert({ lead_id: leadId, content, author_id: user.id });
    if (error) return { ok: false, error: error.message };

    revalidatePath(`/portal/crm/lead/${leadId}`);
    revalidatePath('/portal/crm/leady');
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Chyba při uložení.' };
  }
}

export async function addClientNote(formData: FormData): Promise<NoteActionResult> {
  let clientId: string;
  let content: string;
  try {
    clientId = UuidSchema.parse(formData.get('client_id'));
    content = NoteContentSchema.parse(formData.get('content'));
  } catch (err) {
    return {
      ok: false,
      error: err instanceof z.ZodError ? err.issues.map((i) => i.message).join(', ') : 'Neplatná data.',
    };
  }

  try {
    const { supabase, user } = await requireUser();
    const { error } = await supabase
      .from('crm_notes')
      .insert({ client_id: clientId, content, author_id: user.id });
    if (error) return { ok: false, error: error.message };

    revalidatePath(`/portal/crm/klient/${clientId}`);
    revalidatePath('/portal/crm/klienti');
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Chyba při uložení.' };
  }
}

export async function deleteNote(noteId: string): Promise<NoteActionResult> {
  try {
    UuidSchema.parse(noteId);
  } catch {
    return { ok: false, error: 'Neplatné ID.' };
  }

  try {
    const { supabase } = await requireUser();
    // RLS pustí jen autora nebo admina.
    const { data: note } = await supabase
      .from('crm_notes')
      .select('lead_id, client_id')
      .eq('id', noteId)
      .single();

    const { error } = await supabase.from('crm_notes').delete().eq('id', noteId);
    if (error) return { ok: false, error: error.message };

    if (note) {
      const n = note as { lead_id: string | null; client_id: string | null };
      if (n.lead_id) revalidatePath(`/portal/crm/lead/${n.lead_id}`);
      if (n.client_id) revalidatePath(`/portal/crm/klient/${n.client_id}`);
    }
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Chyba při mazání.' };
  }
}
