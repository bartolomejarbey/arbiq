import { statusLabel } from '@/lib/formatters';

type StatusKind = 'project' | 'invoice' | 'milestone' | 'lead' | 'task' | 'taskPriority' | 'recommendation';

const palette: Record<string, { bg: string; text: string; border: string }> = {
  // Neutral / waiting
  ceka:           { bg: 'bg-caramel/10', text: 'text-caramel',     border: 'border-caramel/30' },
  novy:           { bg: 'bg-caramel/10', text: 'text-caramel',     border: 'border-caramel/30' },
  new:            { bg: 'bg-caramel/10', text: 'text-caramel',     border: 'border-caramel/30' },
  nova:           { bg: 'bg-caramel/10', text: 'text-caramel',     border: 'border-caramel/30' },
  zobrazena:      { bg: 'bg-caramel/10', text: 'text-caramel',     border: 'border-caramel/30' },
  todo:           { bg: 'bg-caramel/10', text: 'text-caramel',     border: 'border-caramel/30' },
  novy_lead:      { bg: 'bg-caramel/10', text: 'text-caramel',     border: 'border-caramel/30' },

  // In progress
  aktivni:        { bg: 'bg-olive/10',   text: 'text-olive',       border: 'border-olive/30' },
  v_priprave:     { bg: 'bg-olive/10',   text: 'text-olive',       border: 'border-olive/30' },
  ve_vyvoji:      { bg: 'bg-olive/10',   text: 'text-olive',       border: 'border-olive/30' },
  k_revizi:       { bg: 'bg-caramel-light/10', text: 'text-caramel-light', border: 'border-caramel-light/30' },
  in_progress:    { bg: 'bg-olive/10',   text: 'text-olive',       border: 'border-olive/30' },
  contacted:      { bg: 'bg-olive/10',   text: 'text-olive',       border: 'border-olive/30' },
  qualified:      { bg: 'bg-olive/10',   text: 'text-olive',       border: 'border-olive/30' },
  paid:           { bg: 'bg-olive/10',   text: 'text-olive',       border: 'border-olive/30' },
  delivered:      { bg: 'bg-olive/10',   text: 'text-olive',       border: 'border-olive/30' },

  // Success
  zaplaceno:      { bg: 'bg-olive/15',   text: 'text-olive',       border: 'border-olive/40' },
  dokoncen:       { bg: 'bg-olive/15',   text: 'text-olive',       border: 'border-olive/40' },
  done:           { bg: 'bg-olive/15',   text: 'text-olive',       border: 'border-olive/40' },
  converted:      { bg: 'bg-olive/15',   text: 'text-olive',       border: 'border-olive/40' },
  realizovana:    { bg: 'bg-olive/15',   text: 'text-olive',       border: 'border-olive/40' },
  zajem:          { bg: 'bg-olive/15',   text: 'text-olive',       border: 'border-olive/40' },

  // Danger
  po_splatnosti:  { bg: 'bg-rust/15',    text: 'text-rust',        border: 'border-rust/40' },
  urgent:         { bg: 'bg-rust/15',    text: 'text-rust',        border: 'border-rust/40' },
  high:           { bg: 'bg-rust/10',    text: 'text-rust',        border: 'border-rust/30' },
  unqualified:    { bg: 'bg-rust/10',    text: 'text-rust',        border: 'border-rust/30' },
  lost:           { bg: 'bg-rust/10',    text: 'text-rust',        border: 'border-rust/30' },
  cancelled:      { bg: 'bg-sandstone/10', text: 'text-sandstone', border: 'border-sandstone/30' },
  zruseno:        { bg: 'bg-sandstone/10', text: 'text-sandstone', border: 'border-sandstone/30' },
  zruseny:        { bg: 'bg-sandstone/10', text: 'text-sandstone', border: 'border-sandstone/30' },
  pozastaven:     { bg: 'bg-sandstone/10', text: 'text-sandstone', border: 'border-sandstone/30' },
  preskocen:      { bg: 'bg-sandstone/10', text: 'text-sandstone', border: 'border-sandstone/30' },
  odmitnuta:      { bg: 'bg-sandstone/10', text: 'text-sandstone', border: 'border-sandstone/30' },

  // Misc
  normal:         { bg: 'bg-coffee',     text: 'text-sepia',       border: 'border-tobacco' },
  low:            { bg: 'bg-coffee',     text: 'text-sandstone',   border: 'border-tobacco' },
};

const fallback = palette.normal;

export default function StatusBadge({ kind, value }: { kind: StatusKind; value: string }) {
  const colors = palette[value] ?? fallback;
  return (
    <span
      className={`inline-block px-2.5 py-1 text-[10px] font-mono uppercase tracking-widest border ${colors.bg} ${colors.text} ${colors.border}`}
    >
      {statusLabel(kind, value)}
    </span>
  );
}
