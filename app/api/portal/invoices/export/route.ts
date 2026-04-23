import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

type Row = {
  invoice_number: string;
  amount: number;
  description: string | null;
  issued_at: string;
  due_date: string;
  paid_at: string | null;
  status: string;
  client: { full_name: string; email: string } | null;
  project: { name: string } | null;
};

const HEADERS = [
  'Číslo',
  'Klient',
  'E-mail',
  'Projekt',
  'Popis',
  'Částka (Kč)',
  'Vystaveno',
  'Splatnost',
  'Zaplaceno',
  'Stav',
];

export async function GET() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new NextResponse('Unauthorized', { status: 401 });

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if ((profile as { role?: string } | null)?.role !== 'admin') {
    return new NextResponse('Forbidden', { status: 403 });
  }

  const { data } = await supabase
    .from('invoices')
    .select('invoice_number, amount, description, issued_at, due_date, paid_at, status, client:profiles!invoices_client_id_fkey(full_name, email), project:projects(name)')
    .order('issued_at', { ascending: false });

  const rows = ((data ?? []) as unknown as Row[]);

  const csv = [
    HEADERS.join(','),
    ...rows.map((r) =>
      [
        r.invoice_number,
        r.client?.full_name ?? '',
        r.client?.email ?? '',
        r.project?.name ?? '',
        r.description ?? '',
        Number(r.amount).toFixed(2).replace('.', ','),
        r.issued_at,
        r.due_date,
        r.paid_at ?? '',
        r.status,
      ].map(csvEscape).join(','),
    ),
  ].join('\r\n');

  // BOM so Excel opens UTF-8 correctly
  const body = '﻿' + csv;
  const filename = `arbiq-faktury-${new Date().toISOString().slice(0, 10)}.csv`;
  return new NextResponse(body, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}

function csvEscape(value: string | number | null | undefined): string {
  const s = value === null || value === undefined ? '' : String(value);
  if (/[",\r\n]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}
