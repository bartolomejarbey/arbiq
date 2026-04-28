'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

const OutcomeValues = ['nezvedl', 'nezajem', 'zajem', 'pozdeji', 'spam', 'imported_to_leads'] as const;
export type OutcomeValue = (typeof OutcomeValues)[number];

export async function takeContact(contactId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Nepřihlášený uživatel.');

  const { error } = await supabase
    .from('databaze_kontaktu')
    .update({ assigned_to: user.id })
    .eq('id', contactId);
  if (error) throw new Error(error.message);
  revalidatePath('/portal/crm/databaze');
}

export async function setContactOutcome(contactId: string, outcome: OutcomeValue) {
  if (!OutcomeValues.includes(outcome)) throw new Error('Neplatný outcome.');
  if (outcome === 'imported_to_leads') {
    throw new Error("Pro stav 'imported_to_leads' použijte importContactToLead.");
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from('databaze_kontaktu')
    .update({
      outcome,
      outcome_at: new Date().toISOString(),
      contacted: true,
      contacted_at: new Date().toISOString(),
    })
    .eq('id', contactId);
  if (error) throw new Error(error.message);
  revalidatePath('/portal/crm/databaze');
}

export async function importContactToLead(contactId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Nepřihlášený uživatel.');

  // Načti kontakt
  const { data: contact, error: cErr } = await supabase
    .from('databaze_kontaktu')
    .select('id, full_name, email, phone, company, notes, imported_to_leads')
    .eq('id', contactId)
    .single();
  if (cErr || !contact) throw new Error(cErr?.message ?? 'Kontakt neexistuje.');
  const c = contact as {
    id: string;
    full_name: string;
    email: string | null;
    phone: string | null;
    company: string | null;
    notes: string | null;
    imported_to_leads: boolean;
  };
  if (c.imported_to_leads) throw new Error('Kontakt už byl importován.');
  if (!c.email) throw new Error('Kontakt nemá email — nelze vytvořit lead.');

  // Allocate case_number z RPC (existuje od 0001)
  const { data: caseRow, error: caseErr } = await supabase.rpc('next_case_number');
  if (caseErr || typeof caseRow !== 'string') throw new Error('Nepodařilo se získat case_number.');

  // Insert do landing_leads
  const { data: insertRow, error: insErr } = await supabase
    .from('landing_leads')
    .insert({
      kampan: 'imported_db',
      name: c.full_name,
      email: c.email,
      phone: c.phone,
      popis: c.notes,
      source_tag: 'imported_db',
      case_number: caseRow,
      assigned_to: user.id,
      status: 'contacted',
      pipeline_stage: 'kontaktovan',
      notes: c.company ? `Importováno z databáze. Firma: ${c.company}` : 'Importováno z databáze kontaktů.',
    })
    .select('id')
    .single();
  if (insErr || !insertRow) throw new Error(insErr?.message ?? 'Insert do landing_leads selhal.');
  const newLeadId = (insertRow as { id: string }).id;

  // Označit kontakt jako importovaný
  const { error: updErr } = await supabase
    .from('databaze_kontaktu')
    .update({
      imported_to_leads: true,
      imported_lead_id: newLeadId,
      outcome: 'imported_to_leads',
      outcome_at: new Date().toISOString(),
      contacted: true,
      contacted_at: new Date().toISOString(),
      contacted_by: user.id,
    })
    .eq('id', contactId);
  if (updErr) throw new Error(updErr.message);

  revalidatePath('/portal/crm/databaze');
  revalidatePath('/portal/crm/leady');
  revalidatePath('/portal/crm/dashboard');
  return { ok: true as const, leadId: newLeadId };
}

const BulkImportRowSchema = z.object({
  full_name: z.string().min(1).max(200),
  email: z.string().email().max(200).optional().nullable(),
  phone: z.string().max(60).optional().nullable(),
  company: z.string().max(200).optional().nullable(),
  position: z.string().max(160).optional().nullable(),
  ico: z.string().max(20).optional().nullable(),
  industry: z.string().max(120).optional().nullable(),
  source: z.string().max(120).optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
});

export type BulkImportResult = {
  inserted: number;
  skipped: number;
  errors: { row: number; message: string }[];
};

export async function bulkImportContacts(rawRows: unknown[]): Promise<BulkImportResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Nepřihlášený uživatel.');

  const errors: { row: number; message: string }[] = [];
  const validRows: z.infer<typeof BulkImportRowSchema>[] = [];

  for (let i = 0; i < rawRows.length; i += 1) {
    const r = rawRows[i];
    const parsed = BulkImportRowSchema.safeParse(r);
    if (!parsed.success) {
      errors.push({ row: i + 1, message: parsed.error.issues.map((iss) => iss.message).join(', ') });
      continue;
    }
    if (!parsed.data.full_name?.trim()) {
      errors.push({ row: i + 1, message: 'full_name je povinné' });
      continue;
    }
    validRows.push(parsed.data);
  }

  if (validRows.length === 0) {
    return { inserted: 0, skipped: rawRows.length, errors };
  }

  // Dedup podle emailu — pokud už existuje v databazi_kontaktu, přeskoč
  const emails = validRows.map((r) => r.email?.toLowerCase()).filter((e): e is string => !!e);
  let existingEmails = new Set<string>();
  if (emails.length > 0) {
    const { data: existing } = await supabase
      .from('databaze_kontaktu')
      .select('email')
      .in('email', emails);
    existingEmails = new Set(((existing ?? []) as { email: string | null }[]).map((r) => r.email?.toLowerCase() ?? ''));
  }

  const toInsert = validRows
    .filter((r) => !r.email || !existingEmails.has(r.email.toLowerCase()))
    .map((r) => ({
      full_name: r.full_name.trim(),
      email: r.email?.toLowerCase().trim() ?? null,
      phone: r.phone?.trim() || null,
      company: r.company?.trim() || null,
      position: r.position?.trim() || null,
      ico: r.ico?.trim() || null,
      industry: r.industry?.trim() || null,
      source: r.source?.trim() || null,
      notes: r.notes?.trim() || null,
      assigned_to: user.id,
    }));

  let inserted = 0;
  if (toInsert.length > 0) {
    const { error: insErr, count } = await supabase
      .from('databaze_kontaktu')
      .insert(toInsert, { count: 'exact' });
    if (insErr) {
      errors.push({ row: 0, message: `Insert selhal: ${insErr.message}` });
    } else {
      inserted = count ?? toInsert.length;
    }
  }

  const skipped = rawRows.length - inserted - errors.length;

  revalidatePath('/portal/crm/databaze');
  return { inserted, skipped: Math.max(0, skipped), errors };
}
