'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

const TaskCreateSchema = z.object({
  title: z.string().min(2).max(200),
  description: z.string().max(2000).optional().default(''),
  assigned_to: z.string().uuid().optional(),
  client_id: z.string().uuid().optional(),
  lead_id: z.string().uuid().optional(),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).default('normal'),
  due_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

export type TaskActionResult = { ok: true } | { ok: false; error: string };

export async function createTask(formData: FormData): Promise<TaskActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'Nepřihlášený uživatel.' };

  let parsed: z.infer<typeof TaskCreateSchema>;
  try {
    parsed = TaskCreateSchema.parse({
      title: String(formData.get('title') ?? ''),
      description: String(formData.get('description') ?? ''),
      assigned_to: String(formData.get('assigned_to') ?? '') || undefined,
      client_id: String(formData.get('client_id') ?? '') || undefined,
      lead_id: String(formData.get('lead_id') ?? '') || undefined,
      priority: (String(formData.get('priority') ?? 'normal') as z.infer<typeof TaskCreateSchema>['priority']),
      due_date: String(formData.get('due_date') ?? '') || undefined,
    });
  } catch (err) {
    return {
      ok: false,
      error: err instanceof z.ZodError ? err.issues.map((i) => i.message).join(', ') : 'Neplatná data.',
    };
  }

  const { error } = await supabase.from('crm_tasks').insert({
    title: parsed.title,
    description: parsed.description || null,
    assigned_to: parsed.assigned_to ?? user.id,
    client_id: parsed.client_id ?? null,
    lead_id: parsed.lead_id ?? null,
    priority: parsed.priority,
    due_date: parsed.due_date ?? null,
    status: 'todo',
  });
  if (error) return { ok: false, error: error.message };

  revalidatePath('/portal/crm/ukoly');
  revalidatePath('/portal/crm/dashboard');
  return { ok: true };
}

export async function setTaskStatus(taskId: string, status: 'todo' | 'in_progress' | 'done' | 'cancelled') {
  const supabase = await createClient();
  const update = {
    status,
    completed_at: status === 'done' ? new Date().toISOString() : null,
  };
  const { error } = await supabase.from('crm_tasks').update(update).eq('id', taskId);
  if (error) throw new Error(error.message);
  revalidatePath('/portal/crm/ukoly');
  revalidatePath('/portal/crm/dashboard');
}

export async function deleteTask(taskId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('crm_tasks').delete().eq('id', taskId);
  if (error) throw new Error(error.message);
  revalidatePath('/portal/crm/ukoly');
}
