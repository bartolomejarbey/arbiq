import { createClient } from '@/lib/supabase/server';
import { untyped } from '@/lib/supabase/untyped';
import { requireViewer } from '@/lib/supabase/viewer';
import PageHeader from '@/components/portal/PageHeader';
import { formatDateTime } from '@/lib/formatters';

export const dynamic = 'force-dynamic';

type Row = {
  id: string;
  action: string;
  target_id: string | null;
  target_type: string | null;
  detail: Record<string, unknown> | null;
  created_at: string;
  actor: { full_name: string | null; email: string | null } | null;
};

const ACTION_LABEL: Record<string, string> = {
  'user.create': 'Vytvořen uživatel',
  'user.reset_password': 'Reset hesla',
  'user.activate': 'Aktivace účtu',
  'user.deactivate': 'Deaktivace účtu',
  'user.invite_to_zone': 'Pozvánka do zóny',
  'client.reassign': 'Přeřazení klienta',
  'client.anonymize': 'GDPR anonymizace',
};

export default async function AuditLogPage() {
  await requireViewer();
  const supabase = await createClient();

  const { data } = await untyped(supabase)
    .from('admin_audit_log')
    .select('id, action, target_id, target_type, detail, created_at, actor:profiles!admin_audit_log_actor_id_fkey(full_name, email)')
    .order('created_at', { ascending: false })
    .limit(200);

  const rows = ((data ?? []) as unknown as Row[]);

  return (
    <div>
      <PageHeader eyebrow="Admin" title="Audit log" subtitle="Citlivé administrátorské akce — kdo, co, kdy." />
      <div className="px-8 py-8">
        {rows.length === 0 ? (
          <p className="text-sandstone text-sm bg-coffee p-8">Zatím žádné záznamy.</p>
        ) : (
          <div className="bg-coffee overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-tobacco">
                  <Th>Čas</Th><Th>Kdo</Th><Th>Akce</Th><Th>Cíl</Th><Th>Detail</Th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={r.id} className={`border-b border-tobacco/50 ${i % 2 === 1 ? 'bg-coffee/40' : ''}`}>
                    <td className="px-4 py-3 text-sandstone whitespace-nowrap font-mono text-xs">{formatDateTime(r.created_at)}</td>
                    <td className="px-4 py-3 text-sepia">{r.actor?.full_name ?? r.actor?.email ?? '—'}</td>
                    <td className="px-4 py-3 text-moonlight">{ACTION_LABEL[r.action] ?? r.action}</td>
                    <td className="px-4 py-3 text-sandstone font-mono text-[10px]">{r.target_id ? `${r.target_type ?? ''} ${r.target_id.slice(0, 8)}…` : '—'}</td>
                    <td className="px-4 py-3 text-sandstone text-xs">{r.detail ? JSON.stringify(r.detail) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="text-left font-mono text-[10px] uppercase tracking-widest text-sandstone px-4 py-3">{children}</th>;
}
