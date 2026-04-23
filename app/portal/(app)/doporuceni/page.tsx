import { redirect } from 'next/navigation';
import { createClient } from "@/lib/supabase/server";
import { requireViewer } from "@/lib/supabase/viewer";
import PageHeader from '@/components/portal/PageHeader';
import RecommendationCard, { type RecommendationData } from '@/components/portal/RecommendationCard';
import EmptyState from '@/components/portal/EmptyState';
import {
  markRecommendationInterested,
  dismissRecommendation,
  markRecommendationsAsViewed,
} from '@/lib/actions/recommendations';

export const dynamic = 'force-dynamic';

type RecRow = {
  id: string;
  service_name: string;
  description: string;
  estimated_price: string | null;
  status: string;
};

export default async function DoporuceniPage() {
  const viewer = await requireViewer();
  const supabase = await createClient();
  const user = viewer;

  // Fetch admin-created recommendations (RLS hides 'nova' from klient,
  // but admin can flip to 'zobrazena' manually OR we mark on first view here)
  const { data: novaRows } = await supabase
    .from('recommendations')
    .select('id')
    .eq('client_id', user.id)
    .eq('status', 'nova');
  const novaIds = ((novaRows ?? []) as unknown as { id: string }[]).map((r) => r.id);
  if (novaIds.length > 0) {
    await markRecommendationsAsViewed(novaIds);
  }

  const { data } = await supabase
    .from('recommendations')
    .select('id, service_name, description, estimated_price, status')
    .eq('client_id', user.id)
    .order('created_at', { ascending: false });

  const recs = ((data ?? []) as unknown as RecRow[]);

  return (
    <div>
      <PageHeader
        eyebrow="Klientská zóna"
        title="Doporučení od ARBIQ"
        subtitle="Co bychom Vám rádi navrhli na základě Vašeho projektu."
      />
      <div className="px-8 py-8">
        {recs.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {recs.map((r) => (
              <RecommendationCard
                key={r.id}
                rec={r as RecommendationData}
                onInterested={markRecommendationInterested}
                onDismiss={dismissRecommendation}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            title="Zatím žádná doporučení"
            description="Jakmile dokončíme analýzu Vašeho projektu, najdete zde konkrétní návrhy dalších kroků."
          />
        )}
      </div>
    </div>
  );
}
