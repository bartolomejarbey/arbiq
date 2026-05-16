'use client';

import { useEffect, useState } from 'react';

const sections = [
  { id: 'co-je-geo', label: 'Co je GEO' },
  { id: 'urgence', label: 'Proč teď' },
  { id: 'dukaz', label: 'Studie' },
  { id: 'sance', label: 'Vaše šance' },
  { id: 'proces', label: 'Proces' },
  { id: 'cenik', label: 'Ceník' },
  { id: 'faq', label: 'FAQ' },
  { id: 'blog', label: 'Články' },
  { id: 'audit-zdarma', label: 'Audit zdarma' },
];

export default function SectionNav() {
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) setActive(visible.target.id);
      },
      {
        rootMargin: '-35% 0px -55% 0px',
        threshold: [0, 0.25, 0.5, 0.75, 1],
      },
    );

    sections.forEach((s) => {
      const el = document.getElementById(s.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <div className="sticky top-[72px] md:top-[112px] z-40 bg-espresso/95 backdrop-blur-xl border-y border-tobacco shadow-[0_8px_20px_rgba(0,0,0,0.3)]">
      <nav
        aria-label="Sekce stránky"
        className="max-w-7xl mx-auto overflow-x-auto scrollbar-thin"
      >
        <ul className="flex items-stretch gap-0 px-6 md:px-12 min-w-max">
          {sections.map((s) => {
            const isActive = active === s.id;
            return (
              <li key={s.id}>
                <a
                  href={`#${s.id}`}
                  className={`inline-flex items-center h-12 px-4 font-mono text-[10px] uppercase tracking-[0.18em] border-b-2 transition-colors ${
                    isActive
                      ? 'text-caramel border-caramel'
                      : 'text-sandstone hover:text-caramel border-transparent'
                  }`}
                >
                  {s.label}
                </a>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
