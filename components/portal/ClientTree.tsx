'use client';

import { Fragment, useState } from 'react';
import Link from 'next/link';
import { ChevronRight, ChevronDown, Building2, FolderKanban, Star, Mail } from 'lucide-react';
import { formatDate, formatMoney } from '@/lib/formatters';
import DeleteClientDialog from '@/components/portal/DeleteClientDialog';

export type TreeFirma = { id: string; nazev: string; ico: string | null; is_primary: boolean };
export type TreeProject = { id: string; name: string; status: string; total_value: number | null };
export type TreeClient = {
  id: string;
  full_name: string;
  email: string;
  created_at: string;
  firmy: TreeFirma[];
  projects: TreeProject[];
};

const headClass = 'text-left font-mono text-[10px] uppercase tracking-widest text-sandstone px-4 py-3';

export default function ClientTree({ clients, isAdmin }: { clients: TreeClient[]; isAdmin: boolean }) {
  const [open, setOpen] = useState<Set<string>>(new Set());

  function toggle(id: string) {
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div className="bg-coffee overflow-x-auto">
      <div className="grid grid-cols-[1fr_auto_auto_auto_auto] items-center border-b border-tobacco min-w-[640px]">
        <div className={headClass}>Klient</div>
        <div className={`${headClass} text-center`}>Firmy</div>
        <div className={`${headClass} text-center`}>Projekty</div>
        <div className={`${headClass} text-right`}>Hodnota</div>
        <div className={`${headClass} text-right pr-6`}>Klient od</div>
      </div>

      {clients.map((c) => {
        const expanded = open.has(c.id);
        const value = c.projects.reduce((s, p) => s + Number(p.total_value ?? 0), 0);
        return (
          <Fragment key={c.id}>
            <div className="grid grid-cols-[1fr_auto_auto_auto_auto] items-center border-b border-tobacco/50 hover:bg-tobacco/30 min-w-[640px]">
              <div className="flex items-center gap-2 px-2 py-3">
                <button
                  onClick={() => toggle(c.id)}
                  className="text-sandstone hover:text-caramel p-1"
                  aria-label={expanded ? 'Sbalit' : 'Rozbalit'}
                  aria-expanded={expanded}
                >
                  {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                </button>
                <div className="min-w-0">
                  <Link href={`/portal/crm/klient/${c.id}`} className="text-moonlight hover:text-caramel">
                    {c.full_name}
                  </Link>
                  <div className="text-sandstone text-xs truncate">{c.email}</div>
                </div>
              </div>
              <div className="text-center text-sepia px-4 py-3 tabular-nums">{c.firmy.length}</div>
              <div className="text-center text-sepia px-4 py-3 tabular-nums">{c.projects.length}</div>
              <div className="text-right text-moonlight px-4 py-3 tabular-nums">{formatMoney(value)}</div>
              <div className="flex items-center justify-end gap-2 px-4 py-3 pr-6">
                <span className="text-sandstone text-xs">{formatDate(c.created_at)}</span>
                {isAdmin && <DeleteClientDialog clientId={c.id} clientName={c.full_name} compact />}
              </div>
            </div>

            {expanded && (
              <div className="border-b border-tobacco/50 bg-espresso/40 min-w-[640px] px-12 py-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-caramel mb-2">
                    <Building2 size={13} /> Firmy
                  </div>
                  {c.firmy.length === 0 ? (
                    <p className="text-sandstone text-xs">Žádná firma. Přidej ji v detailu klienta.</p>
                  ) : (
                    <ul className="space-y-1.5">
                      {c.firmy.map((f) => (
                        <li key={f.id} className="flex items-center gap-2 text-sm">
                          {f.is_primary && <Star size={12} className="text-parchment-gold shrink-0" />}
                          <span className="text-sepia">{f.nazev}</span>
                          {f.ico && <span className="font-mono text-[10px] text-sandstone">IČO {f.ico}</span>}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-caramel mb-2">
                    <FolderKanban size={13} /> Projekty
                  </div>
                  {c.projects.length === 0 ? (
                    <p className="text-sandstone text-xs">Žádný projekt.</p>
                  ) : (
                    <ul className="space-y-1.5">
                      {c.projects.map((p) => (
                        <li key={p.id} className="text-sm">
                          <Link href={`/portal/projekt/${p.id}`} className="text-sepia hover:text-caramel">
                            {p.name}
                          </Link>
                          <span className="font-mono text-[10px] text-sandstone ml-2">{p.status}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <div className="md:col-span-2">
                  <Link
                    href={`/portal/crm/klient/${c.id}`}
                    className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-caramel hover:text-caramel-light"
                  >
                    <Mail size={12} /> Otevřít operační centrum klienta →
                  </Link>
                </div>
              </div>
            )}
          </Fragment>
        );
      })}
    </div>
  );
}
