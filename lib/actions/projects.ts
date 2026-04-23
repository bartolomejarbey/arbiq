'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

const ProjectStatusValues = ['novy', 'v_priprave', 've_vyvoji', 'k_revizi', 'dokoncen', 'pozastaven', 'zruseny'] as const;

const CreateProjectSchema = z.object({
  client_id: z.string().uuid(),
  obchodnik_id: z.string().uuid().optional(),
  name: z.string().min(2).max(200),
  description: z.string().max(4000).optional().default(''),
  status: z.enum(ProjectStatusValues).default('novy'),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  estimated_end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  total_value: z.string().optional().default(''),
});

export type ProjectActionResult = { ok: true; projectId: string } | { ok: false; error: string };

export async function createProject(formData: FormData): Promise<ProjectActionResult> {
  const supabase = await createClient();
  let parsed: z.infer<typeof CreateProjectSchema>;
  try {
    parsed = CreateProjectSchema.parse({
      client_id: String(formData.get('client_id') ?? ''),
      obchodnik_id: String(formData.get('obchodnik_id') ?? '') || undefined,
      name: String(formData.get('name') ?? ''),
      description: String(formData.get('description') ?? ''),
      status: String(formData.get('status') ?? 'novy') as typeof ProjectStatusValues[number],
      start_date: String(formData.get('start_date') ?? '') || undefined,
      estimated_end_date: String(formData.get('estimated_end_date') ?? '') || undefined,
      total_value: String(formData.get('total_value') ?? ''),
    });
  } catch (err) {
    return {
      ok: false,
      error: err instanceof z.ZodError ? err.issues.map((i) => i.message).join(', ') : 'Neplatná data.',
    };
  }

  const value = parsed.total_value ? Number(parsed.total_value.replace(/\s/g, '').replace(',', '.')) : null;

  const { data, error } = await supabase
    .from('projects')
    .insert({
      client_id: parsed.client_id,
      obchodnik_id: parsed.obchodnik_id ?? null,
      name: parsed.name,
      description: parsed.description || null,
      status: parsed.status,
      start_date: parsed.start_date ?? null,
      estimated_end_date: parsed.estimated_end_date ?? null,
      total_value: Number.isFinite(value) ? value : null,
      progress: 0,
    })
    .select('id')
    .single();
  if (error || !data) return { ok: false, error: error?.message ?? 'Nepodařilo se vytvořit projekt.' };

  revalidatePath('/portal/admin/projekty');
  return { ok: true, projectId: (data as { id: string }).id };
}

const UpdateProjectSchema = z.object({
  status: z.enum(ProjectStatusValues).optional(),
  progress: z.coerce.number().min(0).max(100).optional(),
  description: z.string().max(4000).optional(),
  estimated_end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

export async function updateProject(projectId: string, formData: FormData) {
  const supabase = await createClient();
  const raw = {
    status: String(formData.get('status') ?? '') || undefined,
    progress: formData.get('progress') !== null ? formData.get('progress') : undefined,
    description: String(formData.get('description') ?? '') || undefined,
    estimated_end_date: String(formData.get('estimated_end_date') ?? '') || undefined,
  };
  const parsed = UpdateProjectSchema.parse(raw);
  const { error } = await supabase.from('projects').update(parsed).eq('id', projectId);
  if (error) throw new Error(error.message);
  revalidatePath(`/portal/admin/projekt/${projectId}`);
  revalidatePath(`/portal/projekt/${projectId}`);
}

export async function addMilestone(projectId: string, formData: FormData) {
  const supabase = await createClient();
  const name = String(formData.get('name') ?? '').trim();
  if (!name) throw new Error('Název milníku je povinný.');
  const due_date = String(formData.get('due_date') ?? '') || null;
  const description = String(formData.get('description') ?? '') || null;

  // Append to end
  const { count } = await supabase
    .from('milestones')
    .select('id', { count: 'exact', head: true })
    .eq('project_id', projectId);

  const { error } = await supabase.from('milestones').insert({
    project_id: projectId,
    name,
    description,
    due_date,
    status: 'ceka',
    sort_order: (count ?? 0) + 1,
  });
  if (error) throw new Error(error.message);
  revalidatePath(`/portal/admin/projekt/${projectId}`);
  revalidatePath(`/portal/projekt/${projectId}`);
}

export async function setMilestoneStatus(milestoneId: string, projectId: string, status: 'ceka' | 'aktivni' | 'dokoncen' | 'preskocen') {
  const supabase = await createClient();
  const { error } = await supabase
    .from('milestones')
    .update({
      status,
      completed_at: status === 'dokoncen' ? new Date().toISOString() : null,
    })
    .eq('id', milestoneId);
  if (error) throw new Error(error.message);
  revalidatePath(`/portal/admin/projekt/${projectId}`);
  revalidatePath(`/portal/projekt/${projectId}`);
}

export async function deleteMilestone(milestoneId: string, projectId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('milestones').delete().eq('id', milestoneId);
  if (error) throw new Error(error.message);
  revalidatePath(`/portal/admin/projekt/${projectId}`);
  revalidatePath(`/portal/projekt/${projectId}`);
}
