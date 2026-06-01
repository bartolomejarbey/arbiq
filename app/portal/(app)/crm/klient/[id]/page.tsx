import Link from 'next/link';
import { notFound } from 'next/navigation';
import { FileText, FileDown, FileSignature, Paperclip } from 'lucide-react';
import { createClient } from "@/lib/supabase/server";
import { untyped } from "@/lib/supabase/untyped";
import { requireViewer } from "@/lib/supabase/viewer";
import PageHeader from '@/components/portal/PageHeader';
import StatusBadge from '@/components/portal/StatusBadge';
import InvoiceTable, { type InvoiceRow } from '@/components/portal/InvoiceTable';
import NotesTimeline, { type NoteRow } from '@/components/portal/NotesTimeline';
import ContactHistoryForm from './ContactHistoryForm';
import ClientEmailsForm from './ClientEmailsForm';
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
  billing_email: string | null;
  contract_email: string | null;
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

function quoteStatus(s: string): string {
  switch (s) {
    case 'koncept': return 'todo';
    case 'poslano': return 'doing';
    case 'akceptovano': return 'done';
    case 'odmitnuto':
    case 'zruseno':
    case 'expirovano': return 'cancelled';
    default: return s;
  }
}

function contractStatus(s: string): string {
  switch (s) {
    case 'koncept': return 'todo';
    case 'poslano': return 'doing';
    case 'podepsano': return 'done';
    case 'odmítnuto':
    case 'zruseno': return 'cancelled';
    default: return s;
  }
}

export default async function KlientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const viewer = await requireViewer();
  const supabase = await createClient();
  const user = viewer;

  const [
    { data: profileRow },
    { data: projectRows },
    { data: invoiceRows },
    { data: contactRows },
    { data: noteRows },
    { data: contractRows },
    { data: documentRows },
  ] = await Promise.all([
    supabase.from('profiles').select('id, full_name, email, phone, company, ico, website_url, is_active, billing_email, contract_email').eq('id', id).eq('role', 'klient').single(),
    supabase.from('projects').select('id, name, status, progress, total_value').eq('client_id', id).order('created_at', { ascending: false }),
    supabase.from('invoices').select('id, invoice_number, amount, description, issued_at, due_date, paid_at, status, pdf_url').eq('client_id', id).order('issued_at', { ascending: false }),
    supabase.from('crm_contacts').select('id, type, note, next_followup, created_at, obchodnik:profiles!crm_contacts_obchodnik_id_fkey(full_name)').eq('client_id', id).order('created_at', { ascending: false }),
    supabase.from('crm_notes').select('id, content, created_at, author_id, author:profiles!crm_notes_author_id_fkey(full_name)').eq('client_id', id).order('created_at', { ascending: false }),
    untyped(supabase).from('contracts').select('id, contract_number, title, total_price, status, created_at, pdf_url, docx_url').eq('client_id', id).order('created_at', { ascending: false }),
    untyped(supabase).from('documents').select('id, type, title, name, storage_path, file_path, created_at, mime_type, invoice_id, contract_id, quote_id').eq('client_id', id).order('created_at', { ascending: false }),
  ]);

  // Quotes (nabídky) — read separately so we keep the long Promise.all unchanged.
  const { data: quoteRows } = await untyped(supabase)
    .from('quotes')
    .select('id, quote_number, title, total_price, status, valid_until, created_at, pdf_url')
    .eq('client_id', id)
    .order('created_at', { ascending: false });

  const profile = profileRow as unknown as ClientProfile | null;
  if (!profile) notFound();

  const projects = ((projectRows ?? []) as unknown as ProjectRow[]);
  const invoices = ((invoiceRows ?? []) as unknown as InvoiceRow[]);
  const contacts = ((contactRows ?? []) as unknown as ContactRow[]);
  const notes: NoteRow[] = ((noteRows ?? []) as unknown as Array<{
    id: string;
    content: string;
    created_at: string;
    author_id: string;
    author: { full_name: string | null } | null;
  }>).map((n) => ({
    id: n.id,
    content: n.content,
    created_at: n.created_at,
    author_id: n.author_id,
    author_name: n.author?.full_name ?? null,
  }));
  const totalValue = projects.reduce((s, p) => s + Number(p.total_value ?? 0), 0);

  type ContractRow = {
    id: string;
    contract_number: string;
    title: string;
    total_price: number;
    status: string;
    created_at: string;
    pdf_url: string | null;
    docx_url: string | null;
  };
  const contracts = ((contractRows ?? []) as unknown as ContractRow[]);

  type DocumentRow = {
    id: string;
    type: string;
    title: string | null;
    name: string;
    storage_path: string | null;
    file_path: string;
    created_at: string;
    mime_type: string | null;
    invoice_id: string | null;
    contract_id: string | null;
  };
  const documents = ((documentRows ?? []) as unknown as DocumentRow[]);
  const totalContracts = contracts.reduce((s, c) => s + Number(c.total_price ?? 0), 0);

  type QuoteRow = {
    id: string;
    quote_number: string;
    title: string;
    total_price: number;
    status: string;
    valid_until: string;
    created_at: string;
    pdf_url: string | null;
  };
  const quotes = ((quoteRows ?? []) as unknown as QuoteRow[]);
  const totalQuotes = quotes.reduce((s, q) => s + Number(q.total_price ?? 0), 0);

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
          <ClientEmailsForm
            clientId={profile.id}
            mainEmail={profile.email}
            billingEmail={profile.billing_email}
            contractEmail={profile.contract_email}
          />

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
            <h2 className="font-display italic font-black text-2xl text-moonlight mb-4 flex items-center gap-3">
              <FileSignature size={20} className="text-caramel" />
              <span>Nabídky</span>
              {quotes.length > 0 && (
                <span className="font-mono text-[10px] uppercase tracking-widest text-sandstone ml-auto">
                  {quotes.length} ks · {formatMoney(totalQuotes)}
                </span>
              )}
            </h2>
            {quotes.length === 0 ? (
              <p className="text-sandstone text-sm bg-coffee p-6">Žádné cenové nabídky.</p>
            ) : (
              <ul className="space-y-3">
                {quotes.map((q) => (
                  <li key={q.id} className="bg-coffee p-5 flex items-center justify-between gap-4 border-l-2 border-caramel/40">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline gap-3">
                        <span className="font-mono text-caramel text-xs">{q.quote_number}</span>
                        <span className="text-moonlight font-medium truncate">{q.title}</span>
                      </div>
                      <div className="text-sandstone text-xs mt-1">
                        {formatDate(q.created_at)} · Platí do {formatDate(q.valid_until)}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-sepia text-sm">{formatMoney(q.total_price)}</span>
                      <StatusBadge kind="task" value={quoteStatus(q.status)} />
                      {q.pdf_url && (
                        <a
                          href={`/api/portal/quotes/${q.id}/pdf`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-caramel hover:text-caramel-light font-mono text-[10px] uppercase tracking-widest inline-flex items-center gap-1"
                        >
                          <FileText size={12} /> PDF
                        </a>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section>
            <h2 className="font-display italic font-black text-2xl text-moonlight mb-4 flex items-center gap-3">
              <FileSignature size={20} className="text-caramel" />
              <span>Smlouvy</span>
              {contracts.length > 0 && (
                <span className="font-mono text-[10px] uppercase tracking-widest text-sandstone ml-auto">
                  {contracts.length} ks · {formatMoney(totalContracts)}
                </span>
              )}
            </h2>
            {contracts.length === 0 ? (
              <p className="text-sandstone text-sm bg-coffee p-6">Žádné smlouvy.</p>
            ) : (
              <ul className="space-y-3">
                {contracts.map((c) => (
                  <li key={c.id} className="bg-coffee p-5 flex items-center justify-between gap-4 border-l-2 border-caramel/40">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline gap-3">
                        <span className="font-mono text-caramel text-xs">{c.contract_number}</span>
                        <span className="text-moonlight font-medium truncate">{c.title}</span>
                      </div>
                      <div className="text-sandstone text-xs mt-1">{formatDate(c.created_at)}</div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-sepia text-sm">{formatMoney(c.total_price)}</span>
                      <StatusBadge kind="task" value={contractStatus(c.status)} />
                      {c.pdf_url && (
                        <a
                          href={`/api/portal/contracts/${c.id}/pdf`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-caramel hover:text-caramel-light font-mono text-[10px] uppercase tracking-widest inline-flex items-center gap-1"
                        >
                          <FileText size={12} /> PDF
                        </a>
                      )}
                      {c.docx_url && (
                        <a
                          href={`/api/portal/contracts/${c.id}/docx`}
                          className="text-caramel hover:text-caramel-light font-mono text-[10px] uppercase tracking-widest inline-flex items-center gap-1"
                        >
                          <FileDown size={12} /> DOCX
                        </a>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section>
            <h2 className="font-display italic font-black text-2xl text-moonlight mb-4">Faktury</h2>
            <div className="bg-coffee">
              <InvoiceTable invoices={invoices} />
            </div>
          </section>

          <section>
            <h2 className="font-display italic font-black text-2xl text-moonlight mb-4 flex items-center gap-3">
              <Paperclip size={20} className="text-caramel" />
              <span>Dokumenty</span>
              {documents.length > 0 && (
                <span className="font-mono text-[10px] uppercase tracking-widest text-sandstone ml-auto">
                  {documents.length} ks
                </span>
              )}
            </h2>
            {documents.length === 0 ? (
              <p className="text-sandstone text-sm bg-coffee p-6">Žádné dokumenty.</p>
            ) : (
              <ul className="space-y-1 bg-coffee p-4">
                {documents.map((d) => (
                  <li key={d.id} className="flex items-center justify-between gap-4 py-2 border-b border-tobacco/40 last:border-b-0">
                    <div className="min-w-0 flex items-center gap-3">
                      <span className="font-mono text-[9px] uppercase tracking-widest text-caramel bg-tobacco px-2 py-0.5">
                        {d.type}
                      </span>
                      <span className="text-sepia truncate">{d.title ?? d.name}</span>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-sandstone text-xs">{formatDate(d.created_at)}</span>
                      {d.invoice_id && (
                        <a
                          href={`/api/portal/invoices/${d.invoice_id}/pdf`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-caramel hover:text-caramel-light font-mono text-[10px] uppercase tracking-widest"
                        >
                          Otevřít
                        </a>
                      )}
                      {d.contract_id && (
                        <a
                          href={`/api/portal/contracts/${d.contract_id}/${d.mime_type?.includes('word') ? 'docx' : 'pdf'}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-caramel hover:text-caramel-light font-mono text-[10px] uppercase tracking-widest"
                        >
                          Otevřít
                        </a>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section>
            <h2 className="font-display italic font-black text-2xl text-moonlight mb-4">Poznámky</h2>
            <div className="bg-coffee p-6">
              <NotesTimeline
                entity={{ type: 'client', clientId: profile.id }}
                initialNotes={notes}
                currentUserId={user.id}
              />
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
