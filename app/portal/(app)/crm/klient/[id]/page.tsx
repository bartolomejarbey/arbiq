import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { createClient } from "@/lib/supabase/server";
import { requireViewer } from "@/lib/supabase/viewer";
import PageHeader from '@/components/portal/PageHeader';
import StatusBadge from '@/components/portal/StatusBadge';
import InvoiceTable, { type InvoiceRow } from '@/components/portal/InvoiceTable';
import ContactHistoryForm from './ContactHistoryForm';
import { formatDate, formatMoney } from '@/lib/formatters';

export const dynamic = 'force-dynamic';

type ClientProfile = {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  company: string | null;
  ico: string | null;
  website_url: string | null;
  is_active: boolean;
};

type ProjectRow = {
  id: string;
  name: string;
  status: string;
  progress: number;
  total_value: number | null;
};

type ContactRow = {
  id: string;
  type: string;
  note: string;
  next_followup: string | null;
  created_at: string;
  obchodnik: { full_name: string } | null;
};

const contactTypeLabels: Record<string, string> = {
  telefon: 'Telefon',
  email: 'E-mail',
  schuzka: 'Schůzka',
  zprava: 'Zpráva',
  jine: 'Jiné',
};

export default async function KlientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const viewer = await requireViewer();
  const supabase = await createClient();
  const user = viewer;

  const [{ data: profileRow }, { data: projectRows }, { data: invoiceRows }, { data: contactRows }] = await Promise.all([
    supabase.from('profiles').select('id, full_name, email, phone, company, ico, website_url, is_active').eq('id', id).eq('role', 'klient').single(),
    supabase.from('projects').select('id, name, status, progress, total_value').eq('client_id', id).order('created_at', { ascending: false }),
    supabase.from('invoices').select('id, invoice_number, amount, description, issued_at, due_date, paid_at, status, pdf_url').eq('client_id', id).order('issued_at', { ascending: false }),
    supabase.from('crm_contacts').select('id, type, note, next_followup, created_at, obchodnik:profiles!crm_contacts_obchodnik_id_fkey(full_name)').eq('client_id', id).order('created_at', { ascending: false }),
  ]);

  const profile = profileRow as unknown as ClientProfile | null;
  if (!profile) notFound();

  const projects = ((projectRows ?? []) as unknown as ProjectRow[]);
  const invoices = ((invoiceRows ?? []) as unknown as InvoiceRow[]);
  const contacts = ((contactRows ?? []) as unknown as ContactRow[]);
  const totalValue = projects.reduce((s, p) => s + Number(p.total_value ?? 0), 0);

  return (
    <div>
      <PageHeader
        eyebrow="Klient"
        title={profile.full_name}
        subtitle={profile.company ?? undefined}
        actions={profile.is_active ? null : <StatusBadge kind="task" value="cancelled" />}
      />
      <div className="px-8 py-8 grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-12">
          <section>
            <h2 className="font-display italic font-black text-2xl text-moonlight mb-4">Projekty</h2>
            {projects.length === 0 ? (
              <p className="text-sandstone text-sm bg-coffee p-6">Žádné projekty.</p>
            ) : (
              <ul className="space-y-3">
                {projects.map((p) => (
                  <li key={p.id} className="bg-coffee p-5 flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <Link href={`/portal/projekt/${p.id}`} className="text-moonlight hover:text-caramel font-medium">
                        {p.name}
                      </Link>
                      <div className="text-sandstone text-xs mt-1">{p.progress}&nbsp;% hotovo</div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-sepia text-sm">{formatMoney(p.total_value)}</span>
                      <StatusBadge kind="project" value={p.status} />
                    </div>
                  </li>
                ))}
              </ul>
            )}
            <p className="text-sandstone text-xs mt-3">Celková hodnota: <span className="text-moonlight">{formatMoney(totalValue)}</span></p>
          </section>

          <section>
            <h2 className="font-display italic font-black text-2xl text-moonlight mb-4">Faktury</h2>
            <div className="bg-coffee">
              <InvoiceTable invoices={invoices} />
            </div>
          </section>

          <section>
            <h2 className="font-display italic font-black text-2xl text-moonlight mb-4">Historie komunikace</h2>
            <div className="bg-coffee p-6 mb-6">
              <ContactHistoryForm clientId={profile.id} />
            </div>
            {contacts.length === 0 ? (
              <p className="text-sandstone text-sm">Žádné záznamy zatím.</p>
            ) : (
              <ol className="space-y-3">
                {contacts.map((c) => (
                  <li key={c.id} className="bg-coffee p-4 border-l-2 border-caramel/40">
                    <div className="flex items-baseline justify-between gap-3">
                      <div className="font-mono text-[10px] uppercase tracking-widest text-caramel">
                        {contactTypeLabels[c.type] ?? c.type}
                      </div>
                      <div className="text-sandstone text-xs">{formatDate(c.created_at)}</div>
                    </div>
                    <p className="text-sepia mt-1.5 whitespace-pre-wrap">{c.note}</p>
                    <div className="flex items-center justify-between mt-2 text-xs text-sandstone">
                      <span>{c.obchodnik?.full_name ?? ''}</span>
                      {c.next_followup && <span>Follow-up: {formatDate(c.next_followup)}</span>}
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </section>
        </div>

        <aside className="space-y-4">
          <div className="bg-coffee p-6">
            <h3 className="font-mono text-[10px] uppercase tracking-widest text-sandstone mb-3">Kontakt</h3>
            <div className="space-y-3 text-sm">
              <div>
                <div className="text-sandstone text-xs">E-mail</div>
                <a href={`mailto:${profile.email}`} className="text-caramel hover:text-caramel-light">{profile.email}</a>
              </div>
              {profile.phone && (
                <div>
                  <div className="text-sandstone text-xs">Telefon</div>
                  <a href={`tel:${profile.phone}`} className="text-caramel hover:text-caramel-light">{profile.phone}</a>
                </div>
              )}
              {profile.website_url && (
                <div>
                  <div className="text-sandstone text-xs">Web</div>
                  <a href={profile.website_url} target="_blank" rel="noopener noreferrer" className="text-caramel hover:text-caramel-light break-all">
                    {profile.website_url}
                  </a>
                </div>
              )}
              {profile.ico && (
                <div>
                  <div className="text-sandstone text-xs">IČO</div>
                  <div className="text-sepia">{profile.ico}</div>
                </div>
              )}
              {profile.company && (
                <div>
                  <div className="text-sandstone text-xs">Firma</div>
                  <div className="text-sepia">{profile.company}</div>
                </div>
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
