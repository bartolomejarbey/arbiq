'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { requireViewer, getViewerRole } from '@/lib/supabase/viewer';
import {
  pushEventInsert,
  pushEventUpdate,
  pushEventDelete,
} from '@/lib/services/calendar-sync';

const isoDateTime = z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);

const createSchema = z
  .object({
    title: z.string().min(1).max(1024),
    description: z.string().max(8000).optional().nullable(),
    location: z.string().max(500).optional().nullable(),
    start_at: isoDateTime,
    end_at: isoDateTime,
    all_day: z.boolean().default(false),
    timezone: z.string().default('Europe/Prague'),
    visibility: z.enum(['private', 'shared']).default('private'),
    attendees: z.array(z.object({ email: z.string().email() })).default([]),
    with_meet: z.boolean().default(false),
    lead_id: z.string().uuid().optional().nullable(),
    client_id: z.string().uuid().optional().nullable(),
    project_id: z.string().uuid().optional().nullable(),
  })
  .refine(d => new Date(d.end_at) > new Date(d.start_at), {
    message: 'end_at musí být po start_at',
  })
  .refine(
    d => [d.lead_id, d.client_id, d.project_id].filter(Boolean).length <= 1,
    { message: 'Event může mít maximálně jeden CRM link' },
  );

export type CreateEventInput = z.infer<typeof createSchema>;

type Result<T = unknown> = { ok: true; id?: string } & T | { ok: false; error: string };

export async function createEvent(
  input: CreateEventInput,
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const viewer = await requireViewer();
  if (viewer.isPreview) return { ok: false, error: 'preview mode' };

  const parsed = createSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };

  const supabase = await createClient();
  const { data: inserted, error } = await supabase
    .from('events')
    .insert({
      owner_id: viewer.id,
      title: parsed.data.title,
      description: parsed.data.description ?? null,
      location: parsed.data.location ?? null,
      start_at: parsed.data.start_at,
      end_at: parsed.data.end_at,
      all_day: parsed.data.all_day,
      timezone: parsed.data.timezone,
      visibility: parsed.data.visibility,
      attendees: parsed.data.attendees as never,
      lead_id: parsed.data.lead_id ?? null,
      client_id: parsed.data.client_id ?? null,
      project_id: parsed.data.project_id ?? null,
      sync_status: 'pending',
    })
    .select()
    .single();

  if (error || !inserted)
    return { ok: false, error: error?.message ?? 'insert failed' };

  pushEventInsert(inserted, { withMeet: parsed.data.with_meet }).catch(console.error);

  revalidatePath('/portal/(app)/crm/kalendar');
  return { ok: true, id: inserted.id };
}

const updateSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).max(1024).optional(),
  description: z.string().max(8000).nullable().optional(),
  location: z.string().max(500).nullable().optional(),
  start_at: isoDateTime.optional(),
  end_at: isoDateTime.optional(),
  all_day: z.boolean().optional(),
  visibility: z.enum(['private', 'shared']).optional(),
  attendees: z.array(z.object({ email: z.string().email() })).optional(),
  lead_id: z.string().uuid().nullable().optional(),
  client_id: z.string().uuid().nullable().optional(),
  project_id: z.string().uuid().nullable().optional(),
});

export type UpdateEventInput = z.infer<typeof updateSchema>;

export async function updateEvent(
  input: UpdateEventInput,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const viewer = await requireViewer();
  if (viewer.isPreview) return { ok: false, error: 'preview mode' };

  const parsed = updateSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };

  const { id, attendees, ...patch } = parsed.data;
  const supabase = await createClient();
  const updateObj: Record<string, unknown> = { ...patch, sync_status: 'pending' };
  if (attendees !== undefined) updateObj.attendees = attendees;

  const { data: updated, error } = await supabase
    .from('events')
    .update(updateObj as never)
    .eq('id', id)
    .select()
    .single();

  if (error || !updated)
    return { ok: false, error: error?.message ?? 'update failed' };

  pushEventUpdate(updated).catch(console.error);

  revalidatePath('/portal/(app)/crm/kalendar');
  return { ok: true };
}

export async function deleteEvent(
  id: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const viewer = await requireViewer();
  if (viewer.isPreview) return { ok: false, error: 'preview mode' };

  const supabase = await createClient();
  const { data: ev, error: fetchErr } = await supabase
    .from('events')
    .select()
    .eq('id', id)
    .single();
  if (fetchErr || !ev) return { ok: false, error: 'event not found' };

  // Ownership PŘED Google push — sdílenou událost lze přečíst přes RLS, ale
  // smazat (i v Google) smí jen vlastník/admin. Jinak by se cizí událost
  // odstranila z Google dřív, než RLS zablokuje lokální soft-delete.
  const delRole = await getViewerRole();
  if ((ev as { owner_id?: string }).owner_id !== viewer.id && delRole !== 'admin') {
    return { ok: false, error: 'Tuto událost nemůžete smazat.' };
  }

  pushEventDelete(ev).catch(console.error);

  await supabase
    .from('events')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id);

  revalidatePath('/portal/(app)/crm/kalendar');
  return { ok: true };
}

const moveSchema = z
  .object({
    id: z.string().uuid(),
    start_at: isoDateTime,
    end_at: isoDateTime,
  })
  .refine(d => new Date(d.end_at) > new Date(d.start_at));

export type MoveEventInput = z.infer<typeof moveSchema>;

export async function moveEvent(input: MoveEventInput) {
  return updateEvent(input as UpdateEventInput);
}

export async function resizeEvent(input: MoveEventInput) {
  return updateEvent(input as UpdateEventInput);
}
