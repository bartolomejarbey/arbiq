import { redirect } from 'next/navigation';
import { createClient } from "@/lib/supabase/server";
import { requireViewer } from "@/lib/supabase/viewer";
import PageHeader from '@/components/portal/PageHeader';
import LeadTable, { type LeadRow } from '@/components/portal/LeadTable';

export const dynamic = 'force-dynamic';

export default async function LeadyPage() {
  const viewer = await requireViewer();
  const supabase = await createClient();
  const user = viewer;

  const { data } = await supabase
    .from('landing_leads')
    .select('id, created_at, case_number, kampan, obor, velikost_firmy, step3_odpoved, name, email, phone, website_url, popis, utm_source, utm_medium, utm_campaign, status, assigned_to, notes')
    .order('created_at', { ascending: false })
    .limit(500);

  const leads = ((data ?? []) as unknown as LeadRow[]);

  return (
    <div>
      <PageHeader
        eyebrow="CRM"
        title="Leady"
        subtitle="Všechny příchozí leady z reklam a landing pages."
      />
      <div className="px-8 py-8">
        <LeadTable leads={leads} />
      </div>
    </div>
  );
}
