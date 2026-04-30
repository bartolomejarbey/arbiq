'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendEmail } from '@/lib/email/send';
import { PortalInviteEmail } from '@/lib/email/templates/portal-invite';

const LeadStatusValues = ['new', 'contacted', 'qualified', 'unqualified', 'converted', 'lost'] as const;

const SourceTagValues = [
  'meta_ads',
  'google_ads',
  'cold_call',
  'email_outreach',
  'linkedin',
  'doporuceni',
  'organic',
  'imported_db',
  'jine',
] as const;
export type SourceTagValue = (typeof SourceTagValues)[number];

async function requireObchodnikOrAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Nepřihlášený uživatel.');
  const { data } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  const role = (data as { role?: string } | null)?.role;
  if (role !== 'obchodnik' && role !== 'admin') throw new Error('Jen obchodník nebo admin.');
  return { supabase, user, role };
}

const CreateLeadManualSchema = z.object({
  full_name: z.string().trim().min(2, 'Jméno je moc krátké.').max(120),
  email: z.string().email('Neplatný e-mail.').max(200),
  phone: z.string().trim().max(40).optional().default(''),
  company: z.string().trim().max(160).optional().default(''),
  popis: z.string().trim().max(4000).optional().default(''),
  kampan: z.string().trim().min(1).max(80).default('manual'),
  source_tag: z.enum(SourceTagValues).default('jine'),
  assigned_to: z.string().uuid().optional(),
});

export type CreateLeadManualResult = { ok: true; leadId: string; caseNumber: string } | { ok: false; error: string };

export async function createLeadManual(formData: FormData): Promise<CreateLeadManualResult> {
  let supabase;
  let user;
  try {
    ({ supabase, user } = await requireObchodnikOrAdmin());
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Nemáte oprávnění.' };
  }

  let parsed: z.infer<typeof CreateLeadManualSchema>;
  try {
    parsed = CreateLeadManualSchema.parse({
      full_name: String(formData.get('full_name') ?? ''),
      email: String(formData.get('email') ?? ''),
      phone: String(formData.get('phone') ?? ''),
      company: String(formData.get('company') ?? ''),
      popis: String(formData.get('popis') ?? ''),
      kampan: String(formData.get('kampan') ?? 'manual'),
      source_tag: String(formData.get('source_tag') ?? 'jine') as SourceTagValue,
      assigned_to: String(formData.get('assigned_to') ?? '') || undefined,
    });
  } catch (err) {
    return {
      ok: false,
      error: err instanceof z.ZodError ? err.issues.map((i) => i.message).join(', ') : 'Neplatná data.',
    };
  }

  const { data: caseRow, error: caseErr } = await supabase.rpc('next_case_number');
  if (caseErr || typeof caseRow !== 'string') {
    return { ok: false, error: 'Nepodařilo se vygenerovat case_number.' };
  }
  const caseNumber = caseRow;

  // Pokud nezadán assigned_to a volá obchodník, přiřadíme jemu (jako u assignLeadToMe).
  const assignedTo = parsed.assigned_to ?? user.id;

  const { data: inserted, error: insertErr } = await supabase
    .from('landing_leads')
    .insert({
      kampan: parsed.kampan,
      name: parsed.full_name,
      email: parsed.email,
      phone: parsed.phone || null,
      popis: parsed.popis || null,
      source_tag: parsed.source_tag,
      case_number: caseNumber,
      assigned_to: assignedTo,
      status: 'new',
      pipeline_stage: 'novy_lead',
      // Manuální leady mají implicitní companyfield — uložíme do popisu pokud je vyplněno
      // (tabulka landing_leads nemá company sloupec, je odvozen z profilu při konverzi).
    })
    .select('id')
    .single();

  if (insertErr || !inserted) {
    return { ok: false, error: insertErr?.message ?? 'Nepodařilo se uložit lead.' };
  }

  // Pokud user vyplnil company, doplníme do popis (pre-pend) ať se neztratí.
  if (parsed.company) {
    const enrichedPopis = `Firma: ${parsed.company}${parsed.popis ? `\n\n${parsed.popis}` : ''}`;
    await supabase.from('landing_leads').update({ popis: enrichedPopis }).eq('id', (inserted as { id: string }).id);
  }

  revalidatePath('/portal/crm/leady');
  revalidatePath('/portal/crm/dashboard');
  revalidatePath('/portal/crm/pipeline');

  return { ok: true, leadId: (inserted as { id: string }).id, caseNumber };
}

export async function updateLeadSourceTag(leadId: string, tag: SourceTagValue) {
  if (!SourceTagValues.includes(tag)) throw new Error('Neplatný source_tag.');
  const supabase = await createClient();
  const { error } = await supabase.from('landing_leads').update({ source_tag: tag }).eq('id', leadId);
  if (error) throw new Error(error.message);
  revalidatePath('/portal/crm/leady');
  revalidatePath('/portal/crm/dashboard');
  revalidatePath('/portal/crm/pipeline');
}

export async function assignLeadToMe(leadId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Nepřihlášený uživatel.');

  const { error } = await supabase
    .from('landing_leads')
    .update({ assigned_to: user.id, status: 'contacted', pipeline_stage: 'kontaktovan' })
    .eq('id', leadId);
  if (error) throw new Error(error.message);

  revalidatePath('/portal/crm/leady');
  revalidatePath('/portal/crm/dashboard');
  revalidatePath('/portal/crm/pipeline');
}

export async function updateLeadStatus(leadId: string, status: typeof LeadStatusValues[number]) {
  if (!LeadStatusValues.includes(status)) throw new Error('Neplatný status.');
  const supabase = await createClient();
  const { error } = await supabase.from('landing_leads').update({ status }).eq('id', leadId);
  if (error) throw new Error(error.message);
  revalidatePath('/portal/crm/leady');
}

export async function updateLeadPipelineStage(leadId: string, stage: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('landing_leads').update({ pipeline_stage: stage }).eq('id', leadId);
  if (error) throw new Error(error.message);
  revalidatePath('/portal/crm/pipeline');
}

export async function discardLead(leadId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from('landing_leads')
    .update({ status: 'unqualified', pipeline_stage: 'ztraceno' })
    .eq('id', leadId);
  if (error) throw new Error(error.message);
  revalidatePath('/portal/crm/leady');
  revalidatePath('/portal/crm/pipeline');
}

const ConvertSchema = z.object({
  leadId: z.string().uuid(),
  fullName: z.string().min(2).max(120),
  email: z.string().email().max(200),
  phone: z.string().max(40).optional().default(''),
  company: z.string().max(160).optional().default(''),
  ico: z.string().max(20).optional().default(''),
  websiteUrl: z.string().max(500).optional().default(''),
  obchodnikId: z.string().uuid().optional(),
  projectName: z.string().min(2).max(160),
  projectDescription: z.string().max(4000).optional().default(''),
  projectValue: z.string().optional().default(''),
});

export type ConvertResult =
  | { ok: true; clientId: string; projectId: string }
  | { ok: false; error: string };

/**
 * Convert a landing lead into a real client + project. Server-only.
 *
 * Steps:
 *  1. Create the auth user with a random password (admin API).
 *  2. The on_auth_user_created trigger inserts a base profile row.
 *  3. Update profile with the rich data we know (phone, company, ICO, …).
 *  4. Create the project.
 *  5. Mark the lead as converted, link to the new client.
 *  6. Email the client their invite (best-effort).
 */
export async function convertLeadToClient(formData: FormData): Promise<ConvertResult> {
  const supabase = await createClient();
  const {
    data: { user: caller },
  } = await supabase.auth.getUser();
  if (!caller) return { ok: false, error: 'Nepřihlášený uživatel.' };

  // Authorization: only obchodnik/admin
  const { data: callerProfile } = await supabase
    .from('profiles')
    .select('role, is_active')
    .eq('id', caller.id)
    .single();
  const role = (callerProfile as { role?: string; is_active?: boolean } | null)?.role;
  if (role !== 'obchodnik' && role !== 'admin') {
    return { ok: false, error: 'Nemáte oprávnění.' };
  }

  let parsed: z.infer<typeof ConvertSchema>;
  try {
    parsed = ConvertSchema.parse({
      leadId: String(formData.get('leadId') ?? ''),
      fullName: String(formData.get('fullName') ?? ''),
      email: String(formData.get('email') ?? ''),
      phone: String(formData.get('phone') ?? ''),
      company: String(formData.get('company') ?? ''),
      ico: String(formData.get('ico') ?? ''),
      websiteUrl: String(formData.get('websiteUrl') ?? ''),
      obchodnikId: String(formData.get('obchodnikId') ?? '') || undefined,
      projectName: String(formData.get('projectName') ?? ''),
      projectDescription: String(formData.get('projectDescription') ?? ''),
      projectValue: String(formData.get('projectValue') ?? ''),
    });
  } catch (err) {
    return {
      ok: false,
      error: err instanceof z.ZodError ? err.issues.map((i) => i.message).join(', ') : 'Neplatná data.',
    };
  }

  const admin = createAdminClient();
  const password = generatePassword();

  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email: parsed.email,
    password,
    email_confirm: true,
    user_metadata: { full_name: parsed.fullName, role: 'klient' },
  });
  if (createErr || !created?.user) {
    return { ok: false, error: createErr?.message ?? 'Nepodařilo se vytvořit uživatele.' };
  }
  const newUserId = created.user.id;

  // Profile row was auto-created by handle_new_user trigger; enrich it.
  const obchodnikForClient = parsed.obchodnikId ?? (role === 'obchodnik' ? caller.id : null);
  await admin
    .from('profiles')
    .update({
      full_name: parsed.fullName,
      phone: parsed.phone || null,
      company: parsed.company || null,
      ico: parsed.ico || null,
      website_url: parsed.websiteUrl || null,
      role: 'klient',
      assigned_obchodnik: obchodnikForClient,
    })
    .eq('id', newUserId);

  const projectValue = parsed.projectValue ? Number(parsed.projectValue.replace(/\s/g, '').replace(',', '.')) : null;

  const { data: project, error: projErr } = await admin
    .from('projects')
    .insert({
      client_id: newUserId,
      obchodnik_id: obchodnikForClient,
      name: parsed.projectName,
      description: parsed.projectDescription || null,
      status: 'novy',
      progress: 0,
      total_value: Number.isFinite(projectValue) ? projectValue : null,
    })
    .select('id')
    .single();

  if (projErr || !project) {
    // Roll back user create
    await admin.auth.admin.deleteUser(newUserId);
    return { ok: false, error: projErr?.message ?? 'Nepodařilo se vytvořit projekt.' };
  }
  const projectId = (project as { id: string }).id;

  await supabase
    .from('landing_leads')
    .update({
      status: 'converted',
      pipeline_stage: 'aktivni_klient',
      converted_to_client: newUserId,
    })
    .eq('id', parsed.leadId);

  // Best-effort invite email
  if (process.env.RESEND_API_KEY) {
    const loginUrl = `${process.env.APP_URL ?? 'http://localhost:3000'}/portal/login`;
    await sendEmail({
      to: parsed.email,
      subject: 'Vítejte v klientské zóně ARBIQ',
      replyTo: process.env.RESEND_REPLY_TO,
      body: PortalInviteEmail({
        name: parsed.fullName,
        email: parsed.email,
        password,
        loginUrl,
      }),
    }).catch((e) => console.error('portal-invite email failed', e));
  }

  revalidatePath('/portal/crm/leady');
  revalidatePath('/portal/crm/klienti');
  revalidatePath('/portal/crm/dashboard');
  return { ok: true, clientId: newUserId, projectId };
}

function generatePassword(length = 14): string {
  // Avoid look-alike chars (0/O, 1/l/I)
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
  const arr = new Uint8Array(length);
  crypto.getRandomValues(arr);
  let pw = '';
  for (let i = 0; i < length; i++) pw += alphabet[arr[i] % alphabet.length];
  return pw;
}
