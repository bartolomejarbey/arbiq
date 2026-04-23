import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import StatusBadge from './StatusBadge';
import { formatDate } from '@/lib/formatters';

export type ProjectCardData = {
  id: string;
  name: string;
  status: string;
  progress: number;
  estimated_end_date: string | null;
  nextMilestoneName?: string | null;
  nextMilestoneDate?: string | null;
};

export default function ProjectCard({ project }: { project: ProjectCardData }) {
  return (
    <article className="bg-coffee p-6 group relative">
      <div className="flex items-start justify-between gap-4 mb-4">
        <h3 className="font-display italic text-2xl text-moonlight leading-tight">
          {project.name}
        </h3>
        <StatusBadge kind="project" value={project.status} />
      </div>

      <div className="mb-4">
        <div className="flex items-center justify-between mb-2 text-xs">
          <span className="font-mono text-sandstone uppercase tracking-widest">Postup</span>
          <span className="font-mono text-caramel">{project.progress}&nbsp;%</span>
        </div>
        <div className="h-1 bg-tobacco overflow-hidden">
          <div
            className="h-full bg-caramel transition-all"
            style={{ width: `${Math.max(0, Math.min(100, project.progress))}%` }}
          />
        </div>
      </div>

      {(project.nextMilestoneName || project.estimated_end_date) && (
        <div className="text-sm mb-6">
          <div className="font-mono text-[10px] uppercase tracking-widest text-sandstone mb-1">
            {project.nextMilestoneName ? 'Další milník' : 'Odhadované dokončení'}
          </div>
          <div className="text-sepia">
            {project.nextMilestoneName ?? '—'}
            {project.nextMilestoneDate && (
              <span className="text-sandstone"> · {formatDate(project.nextMilestoneDate)}</span>
            )}
            {!project.nextMilestoneName && project.estimated_end_date && (
              <span>{formatDate(project.estimated_end_date)}</span>
            )}
          </div>
        </div>
      )}

      <Link
        href={`/portal/projekt/${project.id}`}
        className="inline-flex items-center gap-2 text-caramel hover:text-caramel-light font-mono text-xs uppercase tracking-widest transition-colors"
      >
        Detail případu <ArrowRight size={14} />
      </Link>
    </article>
  );
}
