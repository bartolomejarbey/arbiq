import { NextResponse } from 'next/server';
import JSZip from 'jszip';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { untyped } from '@/lib/supabase/untyped';
import { downloadDocument } from '@/lib/storage/documents';
import { regenerateInvoicePdf } from '@/lib/actions/invoices';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 120;

const Body = z.object({ ids: z.array(z.string().uuid()).min(1).max(100) });

/** Hromadné stažení faktur jako ZIP (PDF). Admin/obchodník; RLS zúží na vlastní. */
export async function POST(req: Request): Promise<NextResponse> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { data: prof } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  const role = (prof as { role?: string } | null)?.role;
  if (role !== 'admin' && role !== 'obchodnik') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  let body: z.infer<typeof Body>;
  try { body = Body.parse(await req.json()); }
  catch { return NextResponse.json({ error: 'Neplatný požadavek.' }, { status: 400 }); }

  // RLS vrátí jen faktury, na které má uživatel právo.
  const { data: rows } = await untyped(supabase)
    .from('invoices')
    .select('id, pdf_url, invoice_number, kind')
    .in('id', body.ids);
  const invoices = (rows ?? []) as Array<{ id: string; pdf_url: string | null; invoice_number: string; kind: string }>;
  if (invoices.length === 0) return NextResponse.json({ error: 'Žádné dostupné faktury.' }, { status: 404 });

  const zip = new JSZip();
  const used = new Set<string>();
  let added = 0;
  for (const inv of invoices) {
    let path = inv.pdf_url;
    if (!path) {
      const r = await regenerateInvoicePdf(inv.id);
      if (r.ok) path = r.path;
    }
    if (!path) continue;
    try {
      const buf = await downloadDocument(path);
      const base = (inv.kind === 'zaloha'
        ? `Zalohova-faktura-${inv.invoice_number}`
        : `Faktura-${inv.invoice_number}`).replace(/[^A-Za-z0-9._-]/g, '_');
      let name = `${base}.pdf`;
      let n = 2;
      while (used.has(name)) name = `${base}-${n++}.pdf`;
      used.add(name);
      zip.file(name, buf);
      added++;
    } catch (e) {
      console.error('[bulk-zip] download selhalo', inv.id, e);
    }
  }
  if (added === 0) return NextResponse.json({ error: 'PDF se nepodařilo načíst.' }, { status: 500 });

  const content = await zip.generateAsync({ type: 'nodebuffer' });
  const stamp = new Date().toISOString().slice(0, 10);
  return new NextResponse(new Uint8Array(content), {
    status: 200,
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="faktury-${stamp}.zip"`,
      'Cache-Control': 'private, no-store',
    },
  });
}
