import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { isPreviewMode } from '@/lib/supabase/viewer';

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
  if (await isPreviewMode()) {
    return NextResponse.json({ error: 'V náhledovém režimu nelze nahrávat soubory.' }, { status: 403 });
  }

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

  // Ověř že obchodník má daný projekt přiřazen (admin má všechny).
  // RLS na projects.SELECT s policy "obchodnik reads assigned" by toto zachytil,
  // ale defense-in-depth + lepší error.
  if (role === 'obchodnik') {
    const { data: proj } = await supabase
      .from('projects')
      .select('id, obchodnik_id')
      .eq('id', projectId)
      .single();
    const projRow = proj as { id: string; obchodnik_id: string | null } | null;
    if (!projRow || (projRow.obchodnik_id && projRow.obchodnik_id !== user.id)) {
      return NextResponse.json({ error: 'Forbidden — projekt není přiřazen.' }, { status: 403 });
    }
  }

  const safeName = file.name.replace(/[^A-Za-z0-9._-]/g, '_').slice(-120);
  const path = `${projectId}/${Date.now()}-${safeName}`;

  const admin = createAdminClient();
  const { error: uploadErr } = await admin.storage
    .from('documents')
    .upload(path, file, { contentType: file.type, upsert: false });
  if (uploadErr) {
    console.error('[DOCUMENTS UPLOAD] storage upload failed', uploadErr);
    return NextResponse.json({ error: 'Nahrání selhalo.' }, { status: 500 });
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
    console.error('[DOCUMENTS UPLOAD] insert failed', insertErr);
    await admin.storage.from('documents').remove([path]).catch(() => undefined);
    return NextResponse.json({ error: 'Záznam dokumentu selhal.' }, { status: 500 });
  }

  return NextResponse.json({ ok: true, path });
}
