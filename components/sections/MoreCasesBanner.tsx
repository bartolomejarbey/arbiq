"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import CountUp from "@/components/shared/CountUp";
import RevealOnScroll from "@/components/shared/RevealOnScroll";
import DetectiveTag from "@/components/shared/DetectiveTag";

type Stat = {
  value: number;
  prefix?: string;
  suffix?: string;
  label: string;
};

const STATS: Stat[] = [
  { value: 50, suffix: "+", label: "Dokončených projektů" },
  { value: 8, label: "Aktivních produktů" },
  { value: 3, suffix: "+", label: "Roky zkušeností" },
  { value: 100, suffix: "%", label: "Klientů, se kterými spolupracujeme dál" },
];

export default function MoreCasesBanner() {
  return (
    <section className="relative bg-espresso border-y border-caramel/30 py-20 md:py-28 px-6 md:px-12 overflow-hidden">
      {/* Amber radial gradient pozadí */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none opacity-30"
        style={{
          background:
            "radial-gradient(circle at 50% 50%, rgba(201, 152, 106, 0.18), transparent 60%)",
        }}
      />

      <div className="relative max-w-5xl mx-auto text-center">
        <RevealOnScroll>
          <div className="mb-6 flex justify-center">
            <DetectiveTag>ŠPIČKA LEDOVCE</DetectiveTag>
          </div>
          <h2 className="font-display font-black text-moonlight text-4xl md:text-6xl lg:text-7xl mb-8 leading-[1.05]">
            A dalších{" "}
            <span className="text-caramel">47+</span> projektů,
            <br />
            které <span className="italic text-parchment-gold">nesmíme</span> ukázat.
          </h2>
          <p className="text-sepia/80 max-w-2xl mx-auto text-lg leading-relaxed mb-16">
            Tohle je jen špička ledovce. Za sebou máme přes padesát dokončených webů,
            e-shopů a systémů na míru. Některé klienty nesmíme jmenovat — NDA,
            konkurenční důvody, nebo prostě skromnost. Ale výsledky mluví za nás.
          </p>
        </RevealOnScroll>

        {/* Statistiky */}
        <RevealOnScroll delay={0.15}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-6 mb-16">
            {STATS.map((s) => (
              <div key={s.label} className="bg-coffee/40 border border-tobacco/60 px-4 py-8 md:py-10">
                <div className="font-display font-black text-caramel text-5xl md:text-7xl leading-none mb-3">
                  <CountUp end={s.value} prefix={s.prefix} suffix={s.suffix} duration={1.5} />
                </div>
                <div className="font-mono text-[10px] md:text-[11px] uppercase tracking-widest text-sandstone leading-tight">
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </RevealOnScroll>

        {/* CTA */}
        <RevealOnScroll delay={0.3}>
          <p className="font-display italic text-2xl md:text-3xl text-moonlight mb-8">
            Chcete být dalším úspěšným případem?
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/pripad/webove-stranky"
              className="bg-caramel text-espresso px-8 py-4 font-mono text-xs uppercase tracking-widest font-bold hover:bg-caramel-light transition-all inline-flex items-center gap-2 justify-center"
            >
              Návrh webu zdarma <ArrowRight size={14} />
            </Link>
            <Link
              href="/kontakt"
              className="border border-caramel/40 text-caramel px-8 py-4 font-mono text-xs uppercase tracking-widest hover:bg-caramel/10 transition-all inline-flex items-center gap-2 justify-center"
            >
              Domluvit schůzku <ArrowRight size={14} />
            </Link>
          </div>
        </RevealOnScroll>
      </div>
    </section>
  );
}
