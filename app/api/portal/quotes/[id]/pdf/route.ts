import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { untyped } from '@/lib/supabase/untyped';
import { downloadDocument } from '@/lib/storage/documents';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: row } = await untyped(supabase)
    .from('quotes')
    .select('id, quote_number, pdf_url, client_id')
    .eq('id', id)
    .single();
  if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const r = row as unknown as { id: string; quote_number: string; pdf_url: string | null; client_id: string };

  const { data: prof } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  const role = (prof as { role?: string } | null)?.role;
  const ownsQuote = user.id === r.client_id;
  if (!(role === 'admin' || role === 'obchodnik' || ownsQuote)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  if (!r.pdf_url) return NextResponse.json({ error: 'PDF unavailable' }, { status: 404 });

  try {
    const buf = await downloadDocument(r.pdf_url);
    return new NextResponse(new Uint8Array(buf), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="Nabidka-${r.quote_number}.pdf"`,
        'Cache-Control': 'private, no-store',
      },
    });
  } catch (err) {
    console.error('[QUOTE PDF] download', err);
    return NextResponse.json({ error: 'Download failed' }, { status: 500 });
  }
}
