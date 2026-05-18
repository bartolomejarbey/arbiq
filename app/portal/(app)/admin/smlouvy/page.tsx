import { createClient } from '@/lib/supabase/server';
import { untyped } from '@/lib/supabase/untyped';
import { requireViewer } from '@/lib/supabase/viewer';
import PageHeader from '@/components/portal/PageHeader';
import ContractsAdminClient from './ContractsAdminClient';

export const dynamic = 'force-dynamic';

type Row = {
  id: string;
  contract_number: string;
  title: string;
  total_price: number;
  status: string;
  created_at: string;
  pdf_url: string | null;
  docx_url: string | null;
  client_id: string;
  client: { full_name: string; email: string } | null;
  project: { id: string; name: string } | null;
};

type ClientOpt = { id: string; full_name: string; email: string };
type ProjectOpt = { id: string; name: string; client_id: string };

export default async function SmlouvyAdminPage() {
  await requireViewer();
  const supabase = await createClient();

  const [{ data: ctrRows }, { data: clients }, { data: projects }] = await Promise.all([
    untyped(supabase)
      .from('contracts')
      .select(
        'id, contract_number, title, total_price, status, created_at, pdf_url, docx_url, client_id, client:profiles!contracts_client_id_fkey(full_name, email), project:projects(id, name)',
      )
      .order('created_at', { ascending: false }),
    supabase.from('profiles').select('id, full_name, email').eq('role', 'klient').order('full_name'),
    supabase.from('projects').select('id, name, client_id').order('name'),
  ]);

  const contracts = ((ctrRows ?? []) as unknown as Row[]);

  return (
    <div>
      <PageHeader eyebrow="Admin" title="Smlouvy" subtitle="Generování smluv o dílo v PDF i DOCX (sepia šablona ARBIQ)." />
      <div className="px-8 py-8 space-y-8">
        <ContractsAdminClient
          contracts={contracts}
          clients={((clients ?? []) as unknown as ClientOpt[])}
          projects={((projects ?? []) as unknown as ProjectOpt[])}
        />
      </div>
    </div>
  );
}
