'use client';

import { useState, useTransition } from 'react';
import { DragDropContext, Droppable, Draggable, type DropResult } from '@hello-pangea/dnd';
import { formatDateShort } from '@/lib/formatters';
import { updateLeadPipelineStage } from '@/lib/actions/leads';

export type KanbanLead = {
  id: string;
  name: string;
  case_number: string | null;
  kampan: string;
  pipeline_stage: string;
  created_at: string;
  email: string;
};

export const PIPELINE_STAGES: { id: string; label: string }[] = [
  { id: 'novy_lead',         label: 'Nový lead' },
  { id: 'kontaktovan',       label: 'Kontaktován' },
  { id: 'nabidka_odeslana',  label: 'Nabídka odeslána' },
  { id: 'jednani',           label: 'Jednání' },
  { id: 'smlouva',           label: 'Smlouva' },
  { id: 'aktivni_klient',    label: 'Aktivní klient' },
  { id: 'dokonceno',         label: 'Dokončeno' },
  { id: 'ztraceno',          label: 'Ztraceno' },
];

export default function KanbanBoard({ leads }: { leads: KanbanLead[] }) {
  const [items, setItems] = useState(leads);
  const [pending, startTransition] = useTransition();

  function onDragEnd(result: DropResult) {
    if (!result.destination) return;
    const leadId = result.draggableId;
    const newStage = result.destination.droppableId;
    const lead = items.find((l) => l.id === leadId);
    if (!lead || lead.pipeline_stage === newStage) return;

    // Optimistic
    const prev = items;
    setItems(items.map((l) => (l.id === leadId ? { ...l, pipeline_stage: newStage } : l)));

    startTransition(async () => {
      try {
        await updateLeadPipelineStage(leadId, newStage);
      } catch {
        setItems(prev);
      }
    });
  }

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="flex gap-3 overflow-x-auto pb-4">
        {PIPELINE_STAGES.map((stage) => {
          const stageLeads = items.filter((l) => l.pipeline_stage === stage.id);
          return (
            <Droppable droppableId={stage.id} key={stage.id}>
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={`shrink-0 w-72 bg-coffee p-3 transition-colors ${snapshot.isDraggingOver ? 'bg-tobacco' : ''}`}
                >
                  <div className="flex items-baseline justify-between mb-3 px-1">
                    <h3 className="font-mono text-[10px] uppercase tracking-widest text-sandstone">
                      {stage.label}
                    </h3>
                    <span className="font-mono text-xs text-caramel">{stageLeads.length}</span>
                  </div>
                  <div className="space-y-2 min-h-[40px]">
                    {stageLeads.map((lead, index) => (
                      <Draggable draggableId={lead.id} index={index} key={lead.id}>
                        {(prov, snap) => (
                          <div
                            ref={prov.innerRef}
                            {...prov.draggableProps}
                            {...prov.dragHandleProps}
                            className={`bg-espresso p-3 cursor-grab active:cursor-grabbing border-l-2 border-caramel/40 hover:border-caramel transition-colors ${snap.isDragging ? 'opacity-80 ring-1 ring-caramel' : ''}`}
                          >
                            <div className="text-moonlight text-sm font-medium">{lead.name}</div>
                            <div className="text-sandstone text-xs mt-1 truncate">{lead.email}</div>
                            <div className="flex items-center justify-between mt-2 text-[10px] font-mono text-sandstone">
                              <span>{lead.case_number ?? '—'}</span>
                              <span>{formatDateShort(lead.created_at)}</span>
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                </div>
              )}
            </Droppable>
          );
        })}
      </div>
      {pending && (
        <div className="text-sandstone text-xs font-mono mt-2">Synchronizuji…</div>
      )}
    </DragDropContext>
  );
}
