import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

const MAX_BYTES = 25 * 1024 * 1024; // 25 MB
const ALLOWED_TYPES = new Set([
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/webp',
  'text/plain',
  'application/zip',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
]);

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  const role = (profile as { role?: string } | null)?.role;
  if (role !== 'obchodnik' && role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const form = await request.formData();
  const file = form.get('file');
  const projectId = String(form.get('project_id') ?? '');
  const docType = String(form.get('type') ?? 'other');

  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'Soubor chybí.' }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: 'Soubor je větší než 25 MB.' }, { status: 400 });
  }
  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json({ error: `Nepodporovaný typ souboru: ${file.type}` }, { status: 400 });
  }
  if (!/^[0-9a-f-]{36}$/.test(projectId)) {
    return NextResponse.json({ error: 'Neplatný project_id.' }, { status: 400 });
  }

  const safeName = file.name.replace(/[^A-Za-z0-9._-]/g, '_').slice(-120);
  const path = `${projectId}/${Date.now()}-${safeName}`;

  // Use admin client to bypass any storage RLS edge cases (we already validated)
  const admin = createAdminClient();
  const { error: uploadErr } = await admin.storage
    .from('documents')
    .upload(path, file, { contentType: file.type, upsert: false });
  if (uploadErr) {
    return NextResponse.json({ error: uploadErr.message }, { status: 500 });
  }

  const { error: insertErr } = await admin.from('documents').insert({
    project_id: projectId,
    uploaded_by: user.id,
    name: file.name,
    type: docType,
    file_path: path,
    file_size: file.size,
  });
  if (insertErr) {
    // Roll back the upload
    await admin.storage.from('documents').remove([path]).catch(() => undefined);
    return NextResponse.json({ error: insertErr.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, path });
}
