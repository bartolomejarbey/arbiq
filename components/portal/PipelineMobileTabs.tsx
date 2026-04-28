'use client';

import { useState, useTransition } from 'react';
import { ChevronLeft, ChevronRight, Phone, Mail } from 'lucide-react';
import { formatDateShort } from '@/lib/formatters';
import { updateLeadPipelineStage } from '@/lib/actions/leads';
import { PIPELINE_STAGES, type KanbanLead } from './KanbanBoard';

export default function PipelineMobileTabs({ leads }: { leads: KanbanLead[] }) {
  const [items, setItems] = useState(leads);
  const [activeStage, setActiveStage] = useState(PIPELINE_STAGES[0].id);
  const [pending, startTransition] = useTransition();

  const move = (leadId: string, direction: -1 | 1) => {
    const idx = PIPELINE_STAGES.findIndex((s) => s.id === activeStage);
    const targetIdx = idx + direction;
    if (targetIdx < 0 || targetIdx >= PIPELINE_STAGES.length) return;
    const newStage = PIPELINE_STAGES[targetIdx].id;

    const prev = items;
    setItems(items.map((l) => (l.id === leadId ? { ...l, pipeline_stage: newStage } : l)));

    startTransition(async () => {
      try {
        await updateLeadPipelineStage(leadId, newStage);
      } catch {
        setItems(prev);
      }
    });
  };

  const stageLeads = items.filter((l) => l.pipeline_stage === activeStage);
  const stageIdx = PIPELINE_STAGES.findIndex((s) => s.id === activeStage);

  return (
    <div>
      {/* Tab bar — scrollovatelný */}
      <div className="flex gap-1 overflow-x-auto -mx-2 px-2 pb-2 mb-4 border-b border-tobacco">
        {PIPELINE_STAGES.map((s) => {
          const count = items.filter((l) => l.pipeline_stage === s.id).length;
          const active = s.id === activeStage;
          return (
            <button
              key={s.id}
              onClick={() => setActiveStage(s.id)}
              className={`shrink-0 px-3 py-2 font-mono text-[10px] uppercase tracking-widest transition-colors min-h-[44px] inline-flex items-center gap-2 ${
                active ? 'bg-caramel text-espresso' : 'bg-coffee text-sandstone hover:bg-tobacco'
              }`}
            >
              {s.label}
              <span className={`${active ? 'text-espresso' : 'text-caramel'}`}>{count}</span>
            </button>
          );
        })}
      </div>

      {/* Stage indicator */}
      <div className="flex items-center justify-between mb-4 px-1">
        <h3 className="font-display italic font-black text-moonlight text-xl">
          {PIPELINE_STAGES[stageIdx].label}
        </h3>
        <span className="font-mono text-xs text-sandstone">
          {stageIdx + 1} / {PIPELINE_STAGES.length}
        </span>
      </div>

      {/* Lead karty */}
      <div className="space-y-3">
        {stageLeads.length === 0 && (
          <div className="text-center text-sandstone py-12 bg-coffee">
            Žádné leady v této fázi.
          </div>
        )}
        {stageLeads.map((l) => (
          <div key={l.id} className="bg-coffee border-l-4 border-caramel/40 p-4">
            <div className="text-moonlight font-medium">{l.name}</div>
            <div className="text-sandstone text-xs font-mono mt-0.5">
              {l.case_number ?? 'lead'} · {l.kampan} · {formatDateShort(l.created_at)}
            </div>
            <div className="flex flex-wrap gap-2 mt-3">
              <a
                href={`mailto:${l.email}`}
                className="px-3 py-2 min-h-[44px] inline-flex items-center gap-1 text-xs font-mono uppercase tracking-widest bg-caramel/20 text-caramel hover:bg-caramel/30"
              >
                <Mail size={12} /> Email
              </a>
              <button
                onClick={() => move(l.id, -1)}
                disabled={pending || stageIdx === 0}
                className="px-3 py-2 min-h-[44px] inline-flex items-center gap-1 text-xs font-mono uppercase tracking-widest bg-tobacco text-sepia hover:bg-tobacco/70 disabled:opacity-30"
              >
                <ChevronLeft size={14} /> Zpět
              </button>
              <button
                onClick={() => move(l.id, 1)}
                disabled={pending || stageIdx === PIPELINE_STAGES.length - 1}
                className="px-3 py-2 min-h-[44px] ml-auto inline-flex items-center gap-1 text-xs font-mono uppercase tracking-widest bg-caramel text-espresso hover:bg-caramel-light disabled:opacity-30 font-bold"
              >
                Dál <ChevronRight size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {pending && (
        <div className="text-sandstone text-xs font-mono mt-3 text-center">Synchronizuji…</div>
      )}
    </div>
  );
}
