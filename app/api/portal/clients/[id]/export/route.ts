import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { untyped } from '@/lib/supabase/untyped';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GDPR DSAR export (čl. 15 — právo na přístup). Vrátí veškerá data klienta jako
 * stažitelný JSON. Jen admin.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { data: me } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if ((me as { role?: string } | null)?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const admin = createAdminClient();
  const byClient = (t: string, cols = '*') =>
    untyped(admin).from(t).select(cols).eq('client_id', id);

  const [profile, projects, invoices, contracts, quotes, documents, contacts, notes, tasks, emails, recs, metrics] =
    await Promise.all([
      untyped(admin).from('profiles').select('*').eq('id', id).single(),
      byClient('projects'),
      byClient('invoices'),
      byClient('contracts'),
      byClient('quotes'),
      byClient('documents', 'id, type, title, name, mime_type, file_size, created_at'),
      byClient('crm_contacts'),
      byClient('crm_notes'),
      byClient('crm_tasks'),
      byClient('client_emails'),
      byClient('recommendations'),
      byClient('metrics'),
    ]);

  const out = {
    gdpr_export: true,
    note: 'Osobní údaje klienta dle čl. 15 GDPR. Finanční doklady jsou zachovány z titulu zákonné archivační povinnosti.',
    exported_at: new Date().toISOString(),
    client_id: id,
    profile: profile.data ?? null,
    projects: projects.data ?? [],
    invoices: invoices.data ?? [],
    contracts: contracts.data ?? [],
    quotes: quotes.data ?? [],
    documents: documents.data ?? [],
    crm_contacts: contacts.data ?? [],
    crm_notes: notes.data ?? [],
    crm_tasks: tasks.data ?? [],
    correspondence: emails.data ?? [],
    recommendations: recs.data ?? [],
    metrics: metrics.data ?? [],
  };

  return new NextResponse(JSON.stringify(out, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Disposition': `attachment; filename="klient-${id}-gdpr-export.json"`,
      'Cache-Control': 'private, no-store',
    },
  });
}
