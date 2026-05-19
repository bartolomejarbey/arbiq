import { createClient } from '@/lib/supabase/server';
import { untyped } from '@/lib/supabase/untyped';
import { requireViewer } from '@/lib/supabase/viewer';
import PageHeader from '@/components/portal/PageHeader';
import NabidkyAdminClient from './NabidkyAdminClient';

export const dynamic = 'force-dynamic';

type Row = {
  id: string;
  quote_number: string;
  title: string;
  total_price: number;
  status: string;
  valid_until: string;
  created_at: string;
  pdf_url: string | null;
  client_id: string;
  client: { full_name: string; email: string } | null;
  project: { id: string; name: string } | null;
};

type ClientOpt = { id: string; full_name: string; email: string };
type ProjectOpt = { id: string; name: string; client_id: string };

export default async function NabidkyAdminPage() {
  await requireViewer();
  const supabase = await createClient();

  const [{ data: qRows }, { data: clients }, { data: projects }] = await Promise.all([
    untyped(supabase)
      .from('quotes')
      .select(
        'id, quote_number, title, total_price, status, valid_until, created_at, pdf_url, client_id, client:profiles!quotes_client_id_fkey(full_name, email), project:projects(id, name)',
      )
      .order('created_at', { ascending: false }),
    supabase.from('profiles').select('id, full_name, email').eq('role', 'klient').order('full_name'),
    supabase.from('projects').select('id, name, client_id').order('name'),
  ]);

  const quotes = ((qRows ?? []) as unknown as Row[]);

  return (
    <div>
      <PageHeader
        eyebrow="Admin"
        title="Cenové nabídky"
        subtitle="Sales-oriented PDF nabídka před uzavřením smlouvy. 30denní platnost defaultně."
      />
      <div className="px-8 py-8 space-y-8">
        <NabidkyAdminClient
          quotes={quotes}
          clients={((clients ?? []) as unknown as ClientOpt[])}
          projects={((projects ?? []) as unknown as ProjectOpt[])}
        />
      </div>
    </div>
  );
}
