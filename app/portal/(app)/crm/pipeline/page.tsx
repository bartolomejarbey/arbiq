import { createClient } from "@/lib/supabase/server";
import { requireViewer } from "@/lib/supabase/viewer";
import PageHeader from '@/components/portal/PageHeader';
import KanbanBoard, { type KanbanLead } from '@/components/portal/KanbanBoard';
import PipelineMobileTabs from '@/components/portal/PipelineMobileTabs';

export const dynamic = 'force-dynamic';

const PREVIEW_PIPELINE: KanbanLead[] = [
  { id: 'p1',  name: 'Inspektor Lestrade',   case_number: 'LEAD-2026-00042', kampan: 'webove-stranky', pipeline_stage: 'novy_lead',        created_at: '2026-04-23T08:30:00Z', email: 'lestrade@scotland-yard.uk' },
  { id: 'p2',  name: 'Mrs. Hudson',          case_number: 'LEAD-2026-00041', kampan: 'webove-stranky', pipeline_stage: 'novy_lead',        created_at: '2026-04-22T11:00:00Z', email: 'hudson@221b.uk' },
  { id: 'p3',  name: 'Dr. John Watson',      case_number: 'LEAD-2026-00040', kampan: 'rentgen',        pipeline_stage: 'kontaktovan',      created_at: '2026-04-22T14:15:00Z', email: 'watson@221b.uk' },
  { id: 'p4',  name: 'Hercule Poirot',       case_number: 'LEAD-2026-00039', kampan: 'automatizace',   pipeline_stage: 'nabidka_odeslana', created_at: '2026-04-21T11:45:00Z', email: 'poirot@belgian-detective.be' },
  { id: 'p5',  name: 'Miss Marple',          case_number: 'LEAD-2026-00038', kampan: 'webove-stranky', pipeline_stage: 'jednani',          created_at: '2026-04-20T15:30:00Z', email: 'marple@stmarymead.uk' },
  { id: 'p6',  name: 'Sam Spade',            case_number: 'LEAD-2026-00037', kampan: 'firma',          pipeline_stage: 'jednani',          created_at: '2026-04-19T10:00:00Z', email: 'spade@spadearcher.us' },
  { id: 'p7',  name: 'Geppetto Carpentry',   case_number: 'LEAD-2026-00036', kampan: 'remeslnici',     pipeline_stage: 'smlouva',          created_at: '2026-04-18T13:20:00Z', email: 'geppetto@toyworkshop.it' },
  { id: 'p8',  name: 'Irene Adler',          case_number: 'LEAD-2026-00035', kampan: 'aplikace',       pipeline_stage: 'aktivni_klient',   created_at: '2026-04-15T09:00:00Z', email: 'irene@adler.cz' },
  { id: 'p9',  name: 'Sherlock Holmes',      case_number: 'LEAD-2026-00034', kampan: 'aplikace',       pipeline_stage: 'aktivni_klient',   created_at: '2026-04-10T08:00:00Z', email: 'holmes@221b.uk' },
  { id: 'p10', name: 'Velký Gatsby',         case_number: 'LEAD-2026-00033', kampan: 'firma',          pipeline_stage: 'dokonceno',        created_at: '2026-03-20T12:00:00Z', email: 'jay@gatsby.us' },
  { id: 'p11', name: 'Phileas Fogg',         case_number: 'LEAD-2026-00032', kampan: 'webove-stranky', pipeline_stage: 'dokonceno',        created_at: '2026-03-15T14:00:00Z', email: 'fogg@reformclub.uk' },
  { id: 'p12', name: 'Professor Moriarty',   case_number: 'LEAD-2026-00031', kampan: 'webove-stranky', pipeline_stage: 'ztraceno',         created_at: '2026-03-10T16:00:00Z', email: 'moriarty@academy.uk' },
];

export default async function PipelinePage() {
  const viewer = await requireViewer();

  let leads: KanbanLead[];
  let isPreview = false;
  if (viewer.isPreview) {
    leads = PREVIEW_PIPELINE;
    isPreview = true;
  } else {
    const supabase = await createClient();
    const { data } = await supabase
      .from('landing_leads')
      .select('id, name, case_number, kampan, pipeline_stage, created_at, email')
      .order('created_at', { ascending: false })
      .limit(500);
    leads = ((data ?? []) as unknown as KanbanLead[]);
  }

  return (
    <div>
      <PageHeader
        eyebrow={isPreview ? 'CRM · DEMO' : 'CRM'}
        title="Pipeline"
        subtitle={
          isPreview
            ? 'Drag & drop na desktopu, taby na mobilu. (Demo data — Sherlockovi klienti.)'
            : 'Drag & drop na desktopu, taby s tlačítky Zpět/Dál na mobilu.'
        }
      />
      <div className="px-4 md:px-8 py-8">
        <div className="hidden md:block">
          <KanbanBoard leads={leads} />
        </div>
        <div className="md:hidden">
          <PipelineMobileTabs leads={leads} />
        </div>
      </div>
    </div>
  );
}
