import { createClient } from "@/lib/supabase/server";
import { requireViewer } from "@/lib/supabase/viewer";
import { PREVIEW_LEADS } from '@/lib/preview-data';
import PageHeader from '@/components/portal/PageHeader';
import LeadTable, { type LeadRow } from '@/components/portal/LeadTable';
import CreateLeadDialog, { type Obchodnik } from '@/components/portal/CreateLeadDialog';

export const dynamic = 'force-dynamic';

export default async function LeadyPage() {
  const viewer = await requireViewer();

  let leads: LeadRow[];
  let obchodnici: Obchodnik[] = [];
  if (viewer.isPreview) {
    leads = PREVIEW_LEADS as unknown as LeadRow[];
  } else {
    const supabase = await createClient();
    const [{ data: leadsData }, { data: obchData }] = await Promise.all([
      supabase
        .from('landing_leads')
        .select('id, created_at, case_number, kampan, obor, velikost_firmy, step3_odpoved, name, email, phone, website_url, popis, utm_source, utm_medium, utm_campaign, status, source_tag, assigned_to, notes')
        .order('created_at', { ascending: false })
        .limit(500),
      supabase
        .from('profiles')
        .select('id, full_name, email')
        .in('role', ['obchodnik', 'admin'])
        .eq('is_active', true)
        .order('full_name'),
    ]);
    leads = ((leadsData ?? []) as unknown as LeadRow[]);
    obchodnici = ((obchData ?? []) as unknown as Obchodnik[]);
  }

  return (
    <div>
      <PageHeader
        eyebrow="CRM"
        title="Leady"
        subtitle="Všechny příchozí leady z reklam, landing pages a manuálně přidaných."
        actions={!viewer.isPreview ? <CreateLeadDialog obchodnici={obchodnici} /> : undefined}
      />
      <div className="px-8 py-8">
        <LeadTable leads={leads} />
      </div>
    </div>
  );
}
