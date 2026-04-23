'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { notifyPortalUser } from '@/lib/email/notify';

export async function postMessage(projectId: string, formData: FormData) {
  const content = String(formData.get('content') ?? '').trim();
  if (!content) throw new Error('Zpráva nesmí být prázdná.');
  if (content.length > 4000) throw new Error('Zpráva je příliš dlouhá.');

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Nepřihlášený uživatel.');

  const { error } = await supabase.from('messages').insert({
    project_id: projectId,
    author_id: user.id,
    content,
    is_internal: false,
  });
  if (error) throw new Error(error.message);

  // Notify the other side about the new message.
  void notifyAboutNewMessage(projectId, user.id, content);

  revalidatePath(`/portal/projekt/${projectId}`);
}

async function notifyAboutNewMessage(projectId: string, authorId: string, content: string) {
  try {
    const admin = createAdminClient();
    const { data: project } = await admin
      .from('projects')
      .select('id, name, client_id, obchodnik_id')
      .eq('id', projectId)
      .single();
    const proj = project as { id?: string; name?: string; client_id?: string; obchodnik_id?: string | null } | null;
    if (!proj || !proj.client_id || !proj.name) return;

    const { data: authorRow } = await admin.from('profiles').select('role, full_name').eq('id', authorId).single();
    const authorRole = (authorRow as { role?: string; full_name?: string } | null)?.role;
    const authorName = (authorRow as { role?: string; full_name?: string } | null)?.full_name ?? 'Tým ARBIQ';

    const recipientId = authorRole === 'klient' ? proj.obchodnik_id ?? null : proj.client_id;
    if (!recipientId) return;

    await notifyPortalUser({
      recipientId,
      subject: `Nová zpráva v projektu ${proj.name}`,
      heading: 'Nová zpráva v portálu',
      intro: `${authorName} napsal/a v projektu „${proj.name}":\n\n${content.slice(0, 240)}${content.length > 240 ? '…' : ''}`,
      ctaLabel: 'Otevřít konverzaci',
      ctaPath: `/portal/projekt/${projectId}`,
    });
  } catch (err) {
    console.error('notifyAboutNewMessage failed', err);
  }
}

export async function postInternalMessage(projectId: string, formData: FormData) {
  const content = String(formData.get('content') ?? '').trim();
  if (!content) throw new Error('Zpráva nesmí být prázdná.');

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Nepřihlášený uživatel.');

  const { error } = await supabase.from('messages').insert({
    project_id: projectId,
    author_id: user.id,
    content,
    is_internal: true,
  });
  if (error) throw new Error(error.message);

  revalidatePath(`/portal/projekt/${projectId}`);
}
