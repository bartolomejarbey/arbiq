import { createClient } from '@/lib/supabase/server';
import { requireViewer } from '@/lib/supabase/viewer';
import { untyped } from '@/lib/supabase/untyped';
import { PREVIEW_KLIENTI_FOR_CRM } from '@/lib/preview-data';
import PageHeader from '@/components/portal/PageHeader';
import EmptyState from '@/components/portal/EmptyState';
import CreateClientDialog, { type ObchodnikOption, type ExistingClientOption } from '@/components/portal/CreateClientDialog';
import ClientTree, { type TreeClient, type TreeFirma } from '@/components/portal/ClientTree';

export const dynamic = 'force-dynamic';

type RawClient = {
  id: string;
  full_name: string;
  email: string;
  company: string | null;
  created_at: string;
  parent_client_id: string | null;
  archived_at: string | null;
  projects: { id: string; name: string; status: string; total_value: number | null }[] | null;
};

export default async function KlientiPage() {
  const viewer = await requireViewer();

  let treeClients: TreeClient[] = [];
  let obchodnici: ObchodnikOption[] = [];
  let existingClients: ExistingClientOption[] = [];
  let isAdmin = false;

  if (viewer.isPreview) {
    const raw = PREVIEW_KLIENTI_FOR_CRM as unknown as RawClient[];
    treeClients = raw
      .filter((c) => !c.parent_client_id)
      .map((c) => ({
        id: c.id,
        full_name: c.full_name,
        email: c.email,
        created_at: c.created_at,
        firmy: [],
        projects: (c.projects ?? []).map((p) => ({ id: p.id, name: p.name, status: p.status, total_value: p.total_value })),
      }));
  } else {
    const supabase = await createClient();
    const [clientsResp, viewerProfileResp] = await Promise.all([
      untyped(supabase)
        .from('profiles')
        .select('id, full_name, email, company, created_at, parent_client_id, archived_at, projects:projects!projects_client_id_fkey(id, name, status, total_value)')
        .eq('role', 'klient')
        .order('full_name', { ascending: true }),
      supabase.from('profiles').select('role').eq('id', viewer.id).single(),
    ]);

    if (clientsResp.error) {
      console.error('[crm/klienti] načtení klientů selhalo:', clientsResp.error.message);
    }

    const all = ((clientsResp.data ?? []) as unknown as RawClient[]);
    // Strom: jen top-level osoby, bez archivovaných.
    const topLevel = all.filter((c) => !c.parent_client_id && !c.archived_at);

    // Firmy (defenzivně — tabulka nemusí existovat před aplikací migrace 0028).
    const firmyByClient = new Map<string, TreeFirma[]>();
    if (topLevel.length > 0) {
      const ids = topLevel.map((c) => c.id);
      const firmyResp = await untyped(supabase)
        .from('firmy')
        .select('id, client_id, nazev, ico, is_primary')
        .in('client_id', ids)
        .is('archived_at', null)
        .order('is_primary', { ascending: false })
        .order('nazev', { ascending: true });
      if (firmyResp.error) {
        console.warn('[crm/klienti] firmy nenačteny (migrace 0028 zřejmě ještě neaplikována):', firmyResp.error.message);
      } else {
        for (const f of (firmyResp.data ?? []) as Array<TreeFirma & { client_id: string }>) {
          const arr = firmyByClient.get(f.client_id) ?? [];
          arr.push({ id: f.id, nazev: f.nazev, ico: f.ico, is_primary: f.is_primary });
          firmyByClient.set(f.client_id, arr);
        }
      }
    }

    treeClients = topLevel.map((c) => ({
      id: c.id,
      full_name: c.full_name,
      email: c.email,
      created_at: c.created_at,
      firmy: firmyByClient.get(c.id) ?? [],
      projects: (c.projects ?? []).map((p) => ({ id: p.id, name: p.name, status: p.status, total_value: p.total_value })),
    }));

    isAdmin = (viewerProfileResp.data as { role?: string } | null)?.role === 'admin';
    if (isAdmin) {
      const { data: obchData } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .in('role', ['obchodnik', 'admin'])
        .eq('is_active', true)
        .order('full_name');
      obchodnici = ((obchData ?? []) as unknown as ObchodnikOption[]);
      existingClients = topLevel.map((c) => ({ id: c.id, full_name: c.full_name, company: c.company }));
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow={viewer.isPreview ? 'CRM · DEMO' : 'CRM'}
        title="Klienti"
        subtitle="Osoby a jejich firmy. Rozbal klienta pro firmy a projekty, otevři pro celý přehled."
        actions={isAdmin ? <CreateClientDialog obchodnici={obchodnici} existingClients={existingClients} /> : undefined}
      />
      <div className="px-4 md:px-8 py-8">
        {treeClients.length === 0 ? (
          <EmptyState title="Zatím nemáte přiřazené klienty" description="Konvertujte lead nebo si nechte přiřadit klienta administrátorem." />
        ) : (
          <ClientTree clients={treeClients} isAdmin={isAdmin} />
        )}
      </div>
    </div>
  );
}
