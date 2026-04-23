const dateFmt = new Intl.DateTimeFormat('cs-CZ', { day: 'numeric', month: 'long', year: 'numeric' });
const dateShortFmt = new Intl.DateTimeFormat('cs-CZ', { day: 'numeric', month: 'numeric', year: 'numeric' });
const moneyFmt = new Intl.NumberFormat('cs-CZ', { style: 'currency', currency: 'CZK', maximumFractionDigits: 0 });
const numFmt = new Intl.NumberFormat('cs-CZ');

export function formatDate(input: string | Date | null | undefined): string {
  if (!input) return '—';
  const d = typeof input === 'string' ? new Date(input) : input;
  if (Number.isNaN(d.getTime())) return '—';
  return dateFmt.format(d);
}

export function formatDateShort(input: string | Date | null | undefined): string {
  if (!input) return '—';
  const d = typeof input === 'string' ? new Date(input) : input;
  if (Number.isNaN(d.getTime())) return '—';
  return dateShortFmt.format(d);
}

export function formatMoney(amount: number | string | null | undefined): string {
  if (amount === null || amount === undefined) return '—';
  const n = typeof amount === 'string' ? Number.parseFloat(amount) : amount;
  if (Number.isNaN(n)) return '—';
  return moneyFmt.format(n);
}

export function formatNumber(n: number | string | null | undefined): string {
  if (n === null || n === undefined) return '—';
  const num = typeof n === 'string' ? Number.parseFloat(n) : n;
  if (Number.isNaN(num)) return '—';
  return numFmt.format(num);
}

export function daysUntil(input: string | Date | null | undefined): number | null {
  if (!input) return null;
  const d = typeof input === 'string' ? new Date(input) : input;
  if (Number.isNaN(d.getTime())) return null;
  const now = new Date();
  const ms = d.getTime() - now.getTime();
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
}

const projectStatusLabels: Record<string, string> = {
  novy: 'Nový',
  v_priprave: 'V přípravě',
  ve_vyvoji: 'Ve vývoji',
  k_revizi: 'K revizi',
  dokoncen: 'Dokončen',
  pozastaven: 'Pozastaven',
  zruseny: 'Zrušen',
};

const invoiceStatusLabels: Record<string, string> = {
  ceka: 'Čeká',
  zaplaceno: 'Zaplaceno',
  po_splatnosti: 'Po splatnosti',
  zruseno: 'Zrušeno',
};

const milestoneStatusLabels: Record<string, string> = {
  ceka: 'Čeká',
  aktivni: 'Aktivní',
  dokoncen: 'Dokončen',
  preskocen: 'Přeskočen',
};

const leadStatusLabels: Record<string, string> = {
  new: 'Nový',
  contacted: 'Kontaktován',
  qualified: 'Kvalifikován',
  unqualified: 'Nekvalifikován',
  converted: 'Konvertován',
  lost: 'Ztracen',
};

const taskStatusLabels: Record<string, string> = {
  todo: 'K vyřízení',
  in_progress: 'Probíhá',
  done: 'Hotovo',
  cancelled: 'Zrušeno',
};

const taskPriorityLabels: Record<string, string> = {
  low: 'Nízká',
  normal: 'Normální',
  high: 'Vysoká',
  urgent: 'Naléhavá',
};

const recoStatusLabels: Record<string, string> = {
  nova: 'Nová',
  zobrazena: 'Zobrazená',
  zajem: 'Mám zájem',
  odmitnuta: 'Odmítnuto',
  realizovana: 'Realizováno',
};

export function statusLabel(kind: 'project' | 'invoice' | 'milestone' | 'lead' | 'task' | 'taskPriority' | 'recommendation', value: string): string {
  switch (kind) {
    case 'project': return projectStatusLabels[value] ?? value;
    case 'invoice': return invoiceStatusLabels[value] ?? value;
    case 'milestone': return milestoneStatusLabels[value] ?? value;
    case 'lead': return leadStatusLabels[value] ?? value;
    case 'task': return taskStatusLabels[value] ?? value;
    case 'taskPriority': return taskPriorityLabels[value] ?? value;
    case 'recommendation': return recoStatusLabels[value] ?? value;
  }
}
