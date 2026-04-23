import { notFound, redirect } from 'next/navigation';
import { FileText, Download } from 'lucide-react';
import { createClient } from "@/lib/supabase/server";
import { requireViewer } from "@/lib/supabase/viewer";
import PageHeader from '@/components/portal/PageHeader';
import StatusBadge from '@/components/portal/StatusBadge';
import Timeline, { type Milestone } from '@/components/portal/Timeline';
import MessageThread, { type ThreadMessage } from '@/components/portal/MessageThread';
import { formatDate } from '@/lib/formatters';
import { postMessage } from '@/lib/actions/messages';

export const dynamic = 'force-dynamic';

type ProjectRow = {
  id: string;
  name: string;
  description: string | null;
  status: string;
  progress: number;
  start_date: string | null;
  estimated_end_date: string | null;
  client_id: string;
};

type DocumentRow = {
  id: string;
  name: string;
  type: string;
  file_path: string;
};

type MessageRow = {
  id: string;
  content: string;
  is_internal: boolean;
  created_at: string;
  author_id: string;
  author: { id: string; full_name: string; role: string } | null;
};

const documentTypeLabels: Record<string, string> = {
  brief: 'Brief',
  nabidka: 'Nabídka',
  smlouva: 'Smlouva',
  faktura: 'Faktura',
  design: 'Design',
  screenshot: 'Screenshot',
  report: 'Report',
  other: 'Dokument',
};

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const viewer = await requireViewer();
  const supabase = await createClient();
  const user = viewer;

  const { data: projectData } = await supabase
    .from('projects')
    .select('id, name, description, status, progress, start_date, estimated_end_date, client_id')
    .eq('id', id)
    .single();
  const project = projectData as unknown as ProjectRow | null;
  if (!project) notFound();

  const [{ data: milestoneRows }, { data: docRows }, { data: messageRows }] = await Promise.all([
    supabase.from('milestones').select('id, name, description, status, due_date, completed_at').eq('project_id', id).order('sort_order', { ascending: true }),
    supabase.from('documents').select('id, name, type, file_path').eq('project_id', id).order('created_at', { ascending: false }),
    supabase
      .from('messages')
      .select('id, content, is_internal, created_at, author_id, author:profiles!messages_author_id_fkey(id, full_name, role)')
      .eq('project_id', id)
      .order('created_at', { ascending: true }),
  ]);

  const milestones = ((milestoneRows ?? []) as unknown as Milestone[]);
  const documents = ((docRows ?? []) as unknown as DocumentRow[]);
  const rawMessages = ((messageRows ?? []) as unknown as MessageRow[]);

  // Generate signed URLs for documents (1h TTL)
  const docUrls: Record<string, string> = {};
  for (const d of documents) {
    const { data } = await supabase.storage.from('documents').createSignedUrl(d.file_path, 3600);
    if (data?.signedUrl) docUrls[d.id] = data.signedUrl;
  }

  const messages: ThreadMessage[] = rawMessages.map((m) => ({
    id: m.id,
    content: m.content,
    is_internal: m.is_internal,
    created_at: m.created_at,
    author: m.author
      ? {
          id: m.author.id,
          full_name: m.author.full_name,
          role: m.author.role as ThreadMessage['author'] extends infer A ? A extends { role: infer R } ? R : never : never,
        }
      : null,
  }));

  const boundPostMessage = postMessage.bind(null, id);

  return (
    <div>
      <PageHeader
        eyebrow="Případ"
        title={project.name}
        subtitle={project.description ?? undefined}
        actions={<StatusBadge kind="project" value={project.status} />}
      />

      <div className="px-8 py-8 grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-12">
          <section>
            <h2 className="font-display italic font-black text-2xl text-moonlight mb-6">Postup</h2>
            <div className="bg-coffee p-6 mb-6">
              <div className="flex items-center justify-between mb-2 text-xs">
                <span className="font-mono text-sandstone uppercase tracking-widest">Hotovo</span>
                <span className="font-mono text-caramel">{project.progress}&nbsp;%</span>
              </div>
              <div className="h-1.5 bg-tobacco overflow-hidden">
                <div className="h-full bg-caramel transition-all" style={{ width: `${project.progress}%` }} />
              </div>
              <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
                <div>
                  <div className="font-mono text-[10px] uppercase tracking-widest text-sandstone">Začátek</div>
                  <div className="text-sepia">{formatDate(project.start_date)}</div>
                </div>
                <div>
                  <div className="font-mono text-[10px] uppercase tracking-widest text-sandstone">Plánované dokončení</div>
                  <div className="text-sepia">{formatDate(project.estimated_end_date)}</div>
                </div>
              </div>
            </div>
            <div className="bg-coffee p-6">
              <Timeline milestones={milestones} />
            </div>
          </section>

          <section>
            <h2 className="font-display italic font-black text-2xl text-moonlight mb-6">Komunikace</h2>
            <MessageThread messages={messages} currentUserId={user.id} postAction={boundPostMessage} />
          </section>
        </div>

        <aside className="space-y-8">
          <section>
            <h3 className="font-display italic font-black text-xl text-moonlight mb-4">Dokumenty</h3>
            {documents.length === 0 ? (
              <p className="text-sandstone text-sm bg-coffee p-4">Zatím žádné dokumenty.</p>
            ) : (
              <ul className="space-y-2">
                {documents.map((d) => (
                  <li key={d.id} className="bg-coffee p-4 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-mono text-[10px] uppercase tracking-widest text-sandstone">
                        {documentTypeLabels[d.type] ?? d.type}
                      </div>
                      <div className="text-sepia truncate">{d.name}</div>
                    </div>
                    {docUrls[d.id] ? (
                      <a
                        href={docUrls[d.id]}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="shrink-0 text-caramel hover:text-caramel-light"
                        aria-label={`Stáhnout ${d.name}`}
                      >
                        <Download size={16} />
                      </a>
                    ) : (
                      <FileText size={16} className="text-sandstone shrink-0" />
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}
