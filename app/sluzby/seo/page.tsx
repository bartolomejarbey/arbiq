"use client";

import DetectiveTag from "@/components/shared/DetectiveTag";
import MarkerUnderline from "@/components/shared/MarkerUnderline";
import RevealOnScroll from "@/components/shared/RevealOnScroll";
import StaggerGrid from "@/components/shared/StaggerGrid";
import Typewriter from "@/components/shared/Typewriter";
import Link from "next/link";
import { ArrowRight, CheckCircle } from "lucide-react";

const features = [
  "Technická optimalizace — rychlost, struktura, metadata",
  "Klíčová slova — co Vaši zákazníci hledají",
  "Obsah — texty, které čtou lidi i Google",
  "Linkbuilding — budování důvěryhodnosti webu",
  "Měsíční reporting — víte, co se děje a proč",
  "Průběžná optimalizace — SEO nikdy nekončí",
];

export default function SeoPage() {
  return (
    <main>
      {/* Hero */}
      <section className="pt-32 pb-24 bg-espresso">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="max-w-3xl">
            <RevealOnScroll>
              <DetectiveTag className="mb-6">SEO</DetectiveTag>
              <h1 className="font-display font-black text-moonlight text-5xl md:text-7xl leading-[0.9] mb-8">
                Web bez SEO je dopis bez <MarkerUnderline>adresy</MarkerUnderline>.
              </h1>
              <p className="text-lg md:text-xl text-sepia max-w-2xl leading-relaxed">
                <Typewriter text="Děláme Váš web dohledatelný. Poctivě, bez černých technik, bez zaručených prvních pozic." />
              </p>
            </RevealOnScroll>
          </div>
        </div>
      </section>

      {/* Pravda o SEO */}
      <section className="py-24 bg-coffee">
        <div className="max-w-4xl mx-auto px-6 md:px-12">
          {/* Warning Tape */}
          <div className="mb-12 overflow-hidden">
            <div
              className="h-2 w-full"
              style={{
                background:
                  "repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(196,164,120,0.4) 10px, rgba(196,164,120,0.4) 20px)",
              }}
            />
          </div>

          <RevealOnScroll>
            <DetectiveTag className="mb-6">DŮKAZ A</DetectiveTag>
            <h2 className="font-display font-black text-moonlight text-3xl md:text-5xl mb-10">
              Pravda o SEO
            </h2>
          </RevealOnScroll>
          <RevealOnScroll direction="left">
            <div className="bg-espresso border border-tobacco p-8 md:p-10">
              <p className="text-sepia leading-relaxed mb-6">
                Samotný web NENÍ dohledatelný. Nikdy nebude. Pokud Vám to někdo slibuje — lže. A právě proti tomu bojujeme.
              </p>
              <p className="text-sepia leading-relaxed mb-6">
                SEO je dlouhodobá práce, ne jednorázový trik. Výsledky přicházejí za 3 až 6 měsíců. Kdo slibuje jinak, buď neví co dělá, nebo Vám říká to, co chcete slyšet.
              </p>
              <p className="text-sepia leading-relaxed">
                Žádné černé techniky. Žádné zaručené první pozice. Jen poctivá práce, která funguje — a web, který si Google zapamatuje.
              </p>
            </div>
          </RevealOnScroll>
        </div>
      </section>

      {/* Co děláme */}
      <section className="py-24 bg-espresso">
        <div className="max-w-4xl mx-auto px-6 md:px-12">
          <RevealOnScroll>
            <DetectiveTag className="mb-6">CO DĚLÁME</DetectiveTag>
            <h2 className="font-display font-black text-moonlight text-3xl md:text-5xl mb-10">
              Co SEO obnáší
            </h2>
          </RevealOnScroll>
          <StaggerGrid className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {features.map((feature) => (
              <div key={feature} className="flex items-start gap-3 bg-coffee border border-tobacco p-5">
                <CheckCircle className="w-5 h-5 text-caramel mt-1 shrink-0" />
                <span className="text-sepia leading-relaxed">{feature}</span>
              </div>
            ))}
          </StaggerGrid>
        </div>
      </section>

      {/* Ceník */}
      <section className="py-24 bg-parchment paper-texture">
        <div className="max-w-4xl mx-auto px-6 md:px-12 text-center">
          <RevealOnScroll>
            <DetectiveTag variant="light" className="mb-6">
              CENÍK
            </DetectiveTag>
            <h2 className="font-display font-black text-espresso-text text-3xl md:text-5xl mb-10">
              Kolik to stojí
            </h2>
          </RevealOnScroll>
          <RevealOnScroll delay={0.2}>
            <div className="bg-parchment-aged/50 border-2 border-espresso-text/20 p-8 text-center max-w-sm mx-auto">
              <h3 className="font-display font-black text-espresso-text text-xl mb-4">
                SEO správa
              </h3>
              <p className="font-display font-black text-3xl text-espresso-text mb-2">
                4 — 8 000 Kč/měsíc
              </p>
              <p className="text-sandstone">
                Výsledky za 3–6 měsíců. Bez závazku.
              </p>
            </div>
          </RevealOnScroll>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-espresso text-center">
        <div className="max-w-4xl mx-auto px-6 md:px-12">
          <RevealOnScroll>
            <Link
              href="/rentgen"
              className="bg-caramel text-espresso px-10 py-5 font-mono text-xs uppercase tracking-widest font-bold hover:bg-caramel-light transition-all shadow-xl inline-flex items-center gap-2"
            >
              Chci být dohledatelný
              <ArrowRight className="w-4 h-4" />
            </Link>
          </RevealOnScroll>
        </div>
      </section>
    </main>
  );
}
