import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { requireViewer } from '@/lib/supabase/viewer';
import { createClient } from '@/lib/supabase/server';
import PageHeader from '@/components/portal/PageHeader';
import BulkImportForm from '@/components/portal/BulkImportForm';

export const dynamic = 'force-dynamic';

export default async function DatabazeImportPage() {
  const viewer = await requireViewer();

  let role: string = 'admin';
  if (!viewer.isPreview) {
    const supabase = await createClient();
    const { data } = await supabase.from('profiles').select('role').eq('id', viewer.id).single();
    role = (data as { role?: string } | null)?.role ?? 'klient';
  }

  if (role !== 'obchodnik' && role !== 'admin') {
    return (
      <div className="px-8 py-12 text-center text-sandstone">
        Tato sekce je dostupná jen obchodníkům a administrátorům.
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        eyebrow="CRM"
        title="Import kontaktů z CSV"
        subtitle="Nahraj seznam potenciálních leadů (LinkedIn, Firmy.cz, scrape). Po obvolání označíš zájem a kontakt přepošleš do hlavního CRM."
        actions={
          <Link
            href="/portal/crm/databaze"
            className="inline-flex items-center gap-2 text-sepia hover:text-caramel font-mono text-xs uppercase tracking-widest"
          >
            <ArrowLeft size={14} /> Zpět na databázi
          </Link>
        }
      />
      <div className="px-8 py-8 max-w-5xl">
        <BulkImportForm />
      </div>
    </div>
  );
}
