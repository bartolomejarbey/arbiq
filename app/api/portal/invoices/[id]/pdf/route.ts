import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { untyped } from '@/lib/supabase/untyped';
import { downloadDocument } from '@/lib/storage/documents';
import { regenerateInvoicePdf } from '@/lib/actions/invoices';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id } = await params;
  const url = new URL(req.url);
  const wantRegen = url.searchParams.get('regenerate') === '1';

  // Auth — klient vidí jen své, obchodník/admin vidí dle RLS.
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: invRow } = await untyped(supabase)
    .from('invoices')
    .select('id, pdf_url, invoice_number, kind, client_id')
    .eq('id', id)
    .single();
  if (!invRow) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const inv = invRow as unknown as { id: string; pdf_url: string | null; invoice_number: string; kind: string; client_id: string | null };

  // Regenerace (jen admin/obchodnik). RLS to už chrání, ale defensivně check.
  const { data: prof } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  const role = (prof as { role?: string } | null)?.role;

  let pdfPath = inv.pdf_url;
  if (wantRegen || !pdfPath) {
    if (!(role === 'admin' || role === 'obchodnik') && user.id !== inv.client_id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    const result = await regenerateInvoicePdf(id);
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
    pdfPath = result.path;
  }

  if (!pdfPath) return NextResponse.json({ error: 'PDF unavailable' }, { status: 500 });

  try {
    const buf = await downloadDocument(pdfPath);
    const filename = inv.kind === 'zaloha'
      ? `Zalohova-faktura-${inv.invoice_number}.pdf`
      : `Faktura-${inv.invoice_number}.pdf`;
    return new NextResponse(new Uint8Array(buf), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${filename}"`,
        'Cache-Control': 'private, no-store',
      },
    });
  } catch (err) {
    console.error('[INVOICE PDF] download failed', err);
    return NextResponse.json({ error: 'Download failed' }, { status: 500 });
  }
}
