import 'server-only';

import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireViewer } from '@/lib/supabase/viewer';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  await requireViewer();
  const { searchParams } = new URL(req.url);
  const from = searchParams.get('from');
  const to = searchParams.get('to');
  if (!from || !to) {
    return NextResponse.json({ error: 'from/to required' }, { status: 400 });
  }

  const supabase = await createClient();
  const { data } = await supabase
    .from('events')
    .select(
      '*, lead:landing_leads(id, name, case_number), client:profiles!events_client_id_fkey(id, full_name), project:projects(id, name)',
    )
    .gte('start_at', from)
    .lt('start_at', to)
    .is('deleted_at', null)
    .order('start_at');

  return NextResponse.json({ events: data ?? [] });
}
