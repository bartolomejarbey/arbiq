import { NextResponse, type NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { untyped } from '@/lib/supabase/untyped';
import { getDodavatel } from '@/lib/config/dodavatel';
import { renderContractPdf, type ContractDoc, type ContractCustomer } from '@/lib/pdf/contract';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60;

export async function GET(req: NextRequest): Promise<NextResponse> {
  const url = new URL(req.url);
  const token = url.searchParams.get('token');
  if (!process.env.CRON_SECRET || token !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const id = url.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Missing ?id=<contract uuid>' }, { status: 400 });

  const admin = createAdminClient();
  const { data: ctrRow, error: ctrErr } = await untyped(admin)
    .from('contracts')
    .select('*')
    .eq('id', id)
    .single();
  if (ctrErr || !ctrRow) {
    return NextResponse.json({ stage: 'fetch-contract', error: ctrErr?.message ?? 'not found' }, { status: 404 });
  }
  const c = ctrRow as Record<string, unknown>;

  const { data: clientRow } = await untyped(admin)
    .from('profiles')
    .select('full_name, email, phone, company, ico, dic, street, city, representative_name')
    .eq('id', c['client_id'] as string)
    .single();

  const customer: ContractCustomer = {
    full_name: (clientRow as { full_name?: string | null } | null)?.full_name ?? 'Klient',
    email: (clientRow as { email?: string | null } | null)?.email ?? null,
    phone: (clientRow as { phone?: string | null } | null)?.phone ?? null,
    company: (clientRow as { company?: string | null } | null)?.company ?? null,
    ico: (clientRow as { ico?: string | null } | null)?.ico ?? null,
    dic: (clientRow as { dic?: string | null } | null)?.dic ?? null,
    street: (clientRow as { street?: string | null } | null)?.street ?? null,
    city: (clientRow as { city?: string | null } | null)?.city ?? null,
    representative: (clientRow as { representative_name?: string | null } | null)?.representative_name ?? null,
  };

  const dodavatel = await getDodavatel();

  const doc: ContractDoc = {
    contractNumber: c['contract_number'] as string,
    title: c['title'] as string,
    subject: c['subject'] as string,
    scopeBullets: (c['scope_bullets'] as string[] | null) ?? [],
    totalPrice: Number(c['total_price'] ?? 0),
    currency: (c['currency'] as string) ?? 'CZK',
    depositPercent: Number(c['deposit_percent'] ?? 50),
    hourlyRate: Number(c['hourly_rate'] ?? 900),
    monthlyFee: c['monthly_fee'] != null ? Number(c['monthly_fee']) : null,
    deadlineDays: Number(c['deadline_days'] ?? 14),
    warrantyMonths: Number(c['warranty_months'] ?? 3),
    lateFeePerDay: Number(c['late_fee_per_day'] ?? 0.0005),
    penaltyMax: c['penalty_max'] != null ? Number(c['penalty_max']) : null,
    placeOfSigning: (c['place_of_signing'] as string) ?? 'Bělči',
    hasNda: !!c['has_nda'],
    ndaPenalty: Number(c['nda_penalty'] ?? 100000),
    hasExclusivity: !!c['has_exclusivity'],
    exclusivityClause: (c['exclusivity_clause'] as string | null) ?? null,
  };

  const t0 = Date.now();
  try {
    const pdf = await renderContractPdf({ doc, customer, dodavatel });
    return NextResponse.json({
      ok: true,
      ms: Date.now() - t0,
      pdfSize: pdf.length,
      appUrl: process.env.APP_URL,
      cwd: process.cwd(),
    });
  } catch (err) {
    return NextResponse.json({
      ok: false,
      ms: Date.now() - t0,
      stage: 'render',
      error: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack?.split('\n').slice(0, 12) : null,
      appUrl: process.env.APP_URL,
      cwd: process.cwd(),
    }, { status: 500 });
  }
}
