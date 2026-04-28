import Link from 'next/link';
import { Upload } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { requireViewer } from '@/lib/supabase/viewer';
import PageHeader from '@/components/portal/PageHeader';
import DatabazeTable, { type ContactRow } from '@/components/portal/DatabazeTable';

export const dynamic = 'force-dynamic';

export default async function DatabazePage() {
  const viewer = await requireViewer();

  let contacts: ContactRow[] = [];
  const currentUserId = viewer.id;

  if (!viewer.isPreview) {
    const supabase = await createClient();
    const { data } = await supabase
      .from('databaze_kontaktu')
      .select(
        'id, created_at, full_name, email, phone, company, position, industry, source, notes, contacted, outcome, imported_to_leads, assigned_to'
      )
      .order('created_at', { ascending: false })
      .limit(1000);
    contacts = ((data ?? []) as unknown as ContactRow[]);
  }

  return (
    <div>
      <PageHeader
        eyebrow="CRM"
        title="Databáze kontaktů"
        subtitle="Pre-CRM seznam — kontakti z LinkedIn, Firmy.cz, cold outreach. Když projeví zájem, importuj jako lead."
        actions={
          <Link
            href="/portal/crm/databaze/import"
            className="inline-flex items-center gap-2 bg-caramel text-espresso px-4 py-2 font-mono text-xs uppercase tracking-widest font-bold hover:bg-caramel-light transition-colors"
          >
            <Upload size={14} /> Nahrát CSV
          </Link>
        }
      />
      <div className="px-8 py-8">
        <DatabazeTable contacts={contacts} currentUserId={currentUserId} />
      </div>
    </div>
  );
}
