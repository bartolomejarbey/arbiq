'use client';

import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X } from 'lucide-react';
import { createEvent, updateEvent } from '@/lib/actions/calendar';

const formSchema = z.object({
  title: z.string().min(1, 'Název je povinný').max(1024),
  description: z.string().optional(),
  location: z.string().optional(),
  start_at: z.string().min(1),
  end_at: z.string().min(1),
  all_day: z.boolean(),
  visibility: z.enum(['private', 'shared']),
  attendees_text: z.string().optional(),
  with_meet: z.boolean(),
  lead_id: z.string().optional(),
  client_id: z.string().optional(),
  project_id: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

const inputClass =
  'w-full bg-espresso border border-tobacco px-3 py-2 text-moonlight placeholder:text-sandstone/50 focus:border-caramel focus:outline-none';
const labelClass =
  'font-mono text-[10px] uppercase tracking-widest text-sandstone block mb-1.5';

type EventForEdit = {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  start_at: string;
  end_at: string;
  all_day: boolean;
  visibility: 'private' | 'shared';
  attendees: Array<{ email: string }>;
  meet_link: string | null;
  lead_id: string | null;
  client_id: string | null;
  project_id: string | null;
};

export default function EventEditForm({
  event,
  defaultStart,
  defaultEnd,
  onCancel,
  onSaved,
}: {
  event?: EventForEdit;
  defaultStart?: string;
  defaultEnd?: string;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: event
      ? {
          title: event.title,
          description: event.description ?? '',
          location: event.location ?? '',
          start_at: toLocalInput(event.start_at),
          end_at: toLocalInput(event.end_at),
          all_day: event.all_day,
          visibility: event.visibility,
          attendees_text: (event.attendees ?? [])
            .map(a => a.email)
            .join(', '),
          with_meet: !!event.meet_link,
          lead_id: event.lead_id ?? '',
          client_id: event.client_id ?? '',
          project_id: event.project_id ?? '',
        }
      : {
          title: '',
          start_at: defaultStart
            ? toLocalInput(defaultStart)
            : toLocalInput(new Date().toISOString()),
          end_at: defaultEnd
            ? toLocalInput(defaultEnd)
            : toLocalInput(new Date(Date.now() + 30 * 60 * 1000).toISOString()),
          all_day: false,
          visibility: 'private',
          with_meet: false,
        },
  });

  const visibility = watch('visibility');

  const onSubmit = handleSubmit(values => {
    setError(null);
    const attendees = (values.attendees_text ?? '')
      .split(/[,\s]+/)
      .filter(Boolean)
      .map(email => ({ email }));
    startTransition(async () => {
      const sharedInput = {
        title: values.title,
        description: values.description || null,
        location: values.location || null,
        start_at: fromLocalInput(values.start_at),
        end_at: fromLocalInput(values.end_at),
        all_day: values.all_day,
        visibility: values.visibility,
        attendees,
        lead_id: values.lead_id || null,
        client_id: values.client_id || null,
        project_id: values.project_id || null,
      };
      const res = event
        ? await updateEvent({ id: event.id, ...sharedInput })
        : await createEvent({
            ...sharedInput,
            timezone: 'Europe/Prague',
            with_meet: values.with_meet,
          });
      if (!res.ok) setError(res.error);
      else onSaved();
    });
  });

  return (
    <aside className="fixed inset-x-0 bottom-0 top-16 md:right-0 md:left-auto md:w-[420px] bg-coffee md:border-l border-tobacco overflow-y-auto z-30">
      <header className="flex items-center justify-between px-5 py-4 border-b border-tobacco sticky top-0 bg-coffee z-10">
        <h3 className="font-display italic text-xl text-moonlight">
          {event ? 'Upravit event' : 'Nová schůzka'}
        </h3>
        <button onClick={onCancel} aria-label="Zavřít">
          <X size={18} className="text-sandstone hover:text-moonlight" />
        </button>
      </header>

      <form onSubmit={onSubmit} className="px-5 py-4 space-y-3">
        <div>
          <label className={labelClass}>Název *</label>
          <input {...register('title')} className={inputClass} />
          {errors.title && (
            <p className="text-rust text-xs font-mono mt-1">{errors.title.message}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Od</label>
            <input
              type="datetime-local"
              {...register('start_at')}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Do</label>
            <input
              type="datetime-local"
              {...register('end_at')}
              className={inputClass}
            />
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm text-sepia">
          <input type="checkbox" {...register('all_day')} /> Celodenní
        </label>

        <div>
          <label className={labelClass}>Místo</label>
          <input
            {...register('location')}
            placeholder="např. Praha, Online…"
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>Popis</label>
          <textarea
            {...register('description')}
            rows={3}
            className={`${inputClass} resize-none`}
          />
        </div>

        <div>
          <label className={labelClass}>Účastníci (emaily, čárkou)</label>
          <input
            {...register('attendees_text')}
            placeholder="klient@firma.cz, jan@xyz.cz"
            className={inputClass}
          />
        </div>

        {!event && (
          <label className="flex items-center gap-2 text-sm text-sepia">
            <input type="checkbox" {...register('with_meet')} /> Vygenerovat Google Meet link
          </label>
        )}

        <div>
          <label className={labelClass}>Viditelnost</label>
          <select {...register('visibility')} className={inputClass}>
            <option value="private">Soukromé (jen Vy)</option>
            <option value="shared">Sdíleno s týmem</option>
          </select>
          {visibility === 'shared' && (
            <p className="text-xs text-parchment-gold/80 mt-2">
              ◈ Event bude přidán jako Google attendee všem aktivním obchodníkům a adminům.
              E-mailová pozvánka NEBUDE poslána (<code>sendUpdates: &apos;none&apos;</code>).
            </p>
          )}
        </div>

        <div>
          <label className={labelClass}>CRM link (volitelný, max 1)</label>
          <input
            {...register('lead_id')}
            placeholder="lead UUID"
            className={`${inputClass} mb-1`}
          />
          <input
            {...register('client_id')}
            placeholder="klient UUID"
            className={`${inputClass} mb-1`}
          />
          <input
            {...register('project_id')}
            placeholder="projekt UUID"
            className={inputClass}
          />
          <p className="text-[9px] text-sandstone mt-1">
            Pozn.: Picker UI v další iteraci. Zatím UUID přímo.
          </p>
        </div>

        {error && <p className="text-rust text-xs font-mono">{error}</p>}

        <div className="flex items-center gap-3 pt-3 border-t border-tobacco">
          <button
            type="submit"
            disabled={pending}
            className="bg-caramel text-espresso px-5 py-2 font-mono text-[10px] uppercase tracking-widest font-bold hover:bg-caramel-light disabled:opacity-50"
          >
            {pending ? 'Ukládám…' : event ? 'Uložit' : 'Vytvořit'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="text-sandstone hover:text-moonlight font-mono text-[10px] uppercase tracking-widest"
          >
            Zrušit
          </button>
        </div>
      </form>
    </aside>
  );
}

function toLocalInput(iso: string): string {
  const d = new Date(iso);
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60 * 1000).toISOString().slice(0, 16);
}

function fromLocalInput(local: string): string {
  return new Date(local).toISOString();
}
