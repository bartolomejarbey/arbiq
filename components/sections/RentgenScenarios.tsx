"use client";

import Link from "next/link";
import DetectiveTag from "@/components/shared/DetectiveTag";
import RevealOnScroll from "@/components/shared/RevealOnScroll";
import StaggerGrid from "@/components/shared/StaggerGrid";
import { ArrowRight } from "lucide-react";

export default function RentgenScenarios() {
  return (
    <section className="py-32 bg-espresso relative">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <RevealOnScroll>
          <div className="mb-20">
            <DetectiveTag className="mb-4">DETEKTIVNÍ VYŠETŘOVÁNÍ</DetectiveTag>
            <h2 className="font-display font-black text-moonlight text-4xl md:text-6xl mb-4">
              Rentgen Vašeho podnikání
            </h2>
            <p className="text-caramel font-mono text-sm uppercase tracking-widest mb-4">
              1 hodina. 1 detektiv. 0 rizika.
            </p>
            <p className="text-sepia/80 max-w-2xl leading-relaxed">
              Hodinová odborná konzultace, kde projdeme Váš web, marketing, business model a konkurenci. Řekneme Vám přesně, co je špatně a co s tím dělat.
            </p>
          </div>
        </RevealOnScroll>

        <StaggerGrid className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-10" staggerDelay={0.2}>
          {/* Karta 1: Nespokojeni */}
          <div className="bg-coffee border border-tobacco p-8 rotate-[1deg] hover:rotate-0 hover:-translate-y-2 transition-all duration-500 shadow-xl group">
            <div className="mb-6">
              <svg width="40" height="40" viewBox="0 0 40 40" fill="none" className="text-caramel">
                <path d="M20 4C11.16 4 4 11.16 4 20s7.16 16 16 16 16-7.16 16-16S28.84 4 20 4zm0 2c7.73 0 14 6.27 14 14s-6.27 14-14 14S6 27.73 6 20 12.27 6 20 6z" fill="currentColor" opacity="0.3"/>
                <path d="M12 24c0 0 3.5-4 8-4s8 4 8 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" transform="rotate(180 20 24)"/>
                <circle cx="14" cy="16" r="2" fill="currentColor"/>
                <circle cx="26" cy="16" r="2" fill="currentColor"/>
              </svg>
            </div>
            <h3 className="font-display font-bold text-xl text-moonlight mb-3">
              Nespokojeni? Neplatíte.
            </h3>
            <p className="text-sm text-sepia/80 leading-relaxed mb-6">
              Pokud Vám Rentgen nepřinesl žádnou hodnotu, nechceme Vaše peníze. Tlapku na to.
            </p>
            <div className="font-display font-black text-4xl text-caramel">
              0 Kč
            </div>
          </div>

          {/* Karta 2: Spokojeni, jdeme svou cestou */}
          <div className="bg-coffee border border-tobacco p-8 -rotate-[1deg] hover:rotate-0 hover:-translate-y-2 transition-all duration-500 shadow-xl group">
            <div className="mb-6">
              <svg width="40" height="40" viewBox="0 0 40 40" fill="none" className="text-caramel">
                <path d="M6 20c0-1 1-2 2-3 2-2 5-3 5-3s-1 3-1 5c0 3 2 5 2 5l-2 2s-1-1-3-2c-2-1-3-3-3-4z" fill="currentColor" opacity="0.5"/>
                <path d="M34 20c0-1-1-2-2-3-2-2-5-3-5-3s1 3 1 5c0 3-2 5-2 5l2 2s1-1 3-2c2-1 3-3 3-4z" fill="currentColor" opacity="0.5"/>
                <path d="M14 18c0 0 2-6 6-6s6 6 6 6v4c0 4-3 8-6 10-3-2-6-6-6-10v-4z" fill="currentColor" opacity="0.3"/>
                <path d="M16 20l3 3 5-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h3 className="font-display font-bold text-xl text-moonlight mb-3">
              Spokojeni, ale každý jde svou cestou?
            </h3>
            <p className="text-sm text-sepia/80 leading-relaxed mb-6">
              Dostanete report, doporučení a naše číslo pro případ, že si to rozmyslíte.
            </p>
            <div className="font-display font-black text-4xl text-moonlight">
              1 500 Kč
            </div>
          </div>

          {/* Karta 3: Spolupracujeme */}
          <div className="bg-coffee border border-tobacco p-8 rotate-[2deg] hover:rotate-0 hover:-translate-y-2 transition-all duration-500 shadow-xl group">
            <div className="mb-6">
              <svg width="40" height="40" viewBox="0 0 40 40" fill="none" className="text-caramel">
                <path d="M8 22l4-4c1-1 3-1 4 0l4 4 4-4c1-1 3-1 4 0l4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                <rect x="6" y="26" width="28" height="4" rx="1" fill="currentColor" opacity="0.3"/>
                <circle cx="20" cy="14" r="4" fill="currentColor" opacity="0.2"/>
                <path d="M18 14l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h3 className="font-display font-bold text-xl text-moonlight mb-3">
              Spolupracujeme? Rentgen zdarma.
            </h3>
            <p className="text-sm text-sepia/80 leading-relaxed mb-6">
              Bereme ho jako investici do vztahu — a my investujeme rádi.
            </p>
            <div className="font-display font-black text-4xl text-caramel">
              0 Kč
            </div>
            <p className="font-mono text-[10px] text-sandstone uppercase tracking-widest mt-2">
              (odečteno z první faktury)
            </p>
          </div>
        </StaggerGrid>

        {/* CTA + citát */}
        <RevealOnScroll delay={0.3} className="text-center mt-16 space-y-8">
          <Link
            href="/rentgen"
            className="bg-caramel text-espresso px-10 py-5 font-mono text-xs uppercase tracking-widest font-bold hover:scale-[0.98] transition-transform inline-flex items-center gap-2 shadow-xl"
          >
            Objednat Rentgen — bez rizika <ArrowRight size={14} />
          </Link>
          <p className="text-sepia/60 font-serif-alt text-sm max-w-md mx-auto">
            &ldquo;Ne každý web má problém. Ale každý problém má svůj web.&rdquo;
            <span className="block font-mono text-[10px] uppercase tracking-widest text-sandstone mt-2">
              — Detektiv ARBIQ
            </span>
          </p>
        </RevealOnScroll>
      </div>
    </section>
  );
}
