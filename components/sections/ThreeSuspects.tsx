"use client";

import DetectiveTag from "@/components/shared/DetectiveTag";
import RevealOnScroll from "@/components/shared/RevealOnScroll";
import StaggerGrid from "@/components/shared/StaggerGrid";
import { Bot, MessageSquareWarning, Copy } from "lucide-react";

const suspects = [
  {
    number: "#01",
    name: "AI WEBY",
    subtitle: "Hlavní podezřelý: AI",
    description: "Generované umělou inteligencí, bez kontroly, bez SEO, bez konverzí. Vypadají dobře, dokud se nepokusí prodat. Pak se rozbijí — a nikdo je neumí opravit. Ani autor.",
    icon: Bot,
    rotation: "rotate-[1deg]",
    mostWanted: true,
  },
  {
    number: "#02",
    name: "PRÁZDNÉ SLIBY",
    subtitle: "Hlavní podezřelý: Šablonová agentura",
    description: "Slíbí Vám všechno: růst, ROI, transparentnost. Dodá reporty. Reporty nejsou výsledky. Reporty jsou jen drahý způsob, jak Vám říct, že se nic neděje.",
    icon: MessageSquareWarning,
    rotation: "-rotate-[2deg]",
    mostWanted: false,
  },
  {
    number: "#03",
    name: "LEVNÉ ŠABLONY",
    subtitle: "Hlavní podezřelý: ThemeForest",
    description: "Stejný web jako dalších dvě stě firem v oboru. Klient si Vás nezapamatuje. Google si Vás nezapamatuje. Konkurent ano — protože ji koupil před Vámi.",
    icon: Copy,
    rotation: "rotate-[2deg]",
    mostWanted: false,
  },
];

export default function ThreeSuspects() {
  return (
    <section className="py-32 bg-espresso relative">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <RevealOnScroll>
          <div className="mb-20">
            <DetectiveTag className="mb-4">SPIS: VYŠETŘOVÁNÍ</DetectiveTag>
            <h2 className="font-display font-black text-moonlight text-4xl md:text-6xl">
              Tři podezřelí
            </h2>
            <p className="text-sepia/70 mt-4 max-w-xl">
              Co stojí za rozbitými weby v Česku.
            </p>
          </div>
        </RevealOnScroll>

        <StaggerGrid className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12" staggerDelay={0.2}>
          {suspects.map((s) => {
            const Icon = s.icon;
            return (
              <div
                key={s.number}
                className={`relative bg-coffee border border-tobacco p-8 ${s.rotation} hover:rotate-0 hover:border-caramel/40 hover:-translate-y-2 transition-all duration-500 shadow-xl group`}
              >
                {s.mostWanted && (
                  <div className="absolute -top-3 -right-3 bg-rust text-moonlight px-3 py-1 font-mono text-[9px] uppercase tracking-widest -rotate-12 border border-rust/60 shadow-lg">
                    MOST WANTED
                  </div>
                )}

                <div className="font-mono text-7xl md:text-8xl text-caramel/20 leading-none mb-2 font-bold">
                  {s.number}
                </div>

                <Icon size={32} className="text-caramel mb-4 group-hover:scale-110 transition-transform duration-300" strokeWidth={1.5} />

                <span className="font-mono text-[10px] uppercase tracking-widest text-sandstone block mb-2">
                  PODEZŘELÝ {s.number.replace("#", "č. ")}
                </span>

                <h3 className="font-display font-bold text-2xl md:text-3xl text-moonlight mb-2">
                  {s.name}
                </h3>

                <p className="text-xs text-caramel/70 mb-4">{s.subtitle}</p>

                <p className="text-sm text-sepia leading-relaxed">{s.description}</p>

                <div className="mt-6 pt-4 border-t border-tobacco">
                  <span className="font-mono text-[9px] uppercase tracking-widest text-rust">
                    STATUS: HLEDANÝ
                  </span>
                </div>
              </div>
            );
          })}
        </StaggerGrid>
      </div>
    </section>
  );
}
