import DetectiveTag from '@/components/shared/DetectiveTag';
import MarkerUnderline from '@/components/shared/MarkerUnderline';
import RevealOnScroll from '@/components/shared/RevealOnScroll';
import StaggerGrid from '@/components/shared/StaggerGrid';
import { ArrowRight, ArrowDown } from 'lucide-react';

const metrics = [
  { number: '800M+', label: 'uživatelů ChatGPT týdně' },
  { number: '4,4×', label: 'vyšší konverze z AI traffic' },
  { number: '25 %', label: 'Google dotazů končí AI odpovědí' },
  { number: '115 %', label: 'nárůst viditelnosti pro menší weby' },
];

export default function Hero() {
  return (
    <section className="pb-20 md:pb-24 pt-8 px-6 md:px-12">
      <div className="max-w-7xl mx-auto">
        <RevealOnScroll>
          <DetectiveTag className="mb-6 md:mb-8">NOVÝ PŘÍPAD — GEO &amp; AI VIDITELNOST</DetectiveTag>
        </RevealOnScroll>

        <RevealOnScroll delay={0.1}>
          <h1 className="font-display font-black text-moonlight text-[2rem] sm:text-4xl md:text-6xl lg:text-7xl leading-[0.95] mb-6 md:mb-8 max-w-5xl">
            Vaše konkurence utrácí stovky tisíc měsíčně, aby Vás přebíjela v Googlu.
            <br className="hidden sm:inline" />{' '}
            <span className="text-caramel">
              AI vyhledávání jim právě <MarkerUnderline>smazalo náskok</MarkerUnderline>.
            </span>
          </h1>
        </RevealOnScroll>

        <RevealOnScroll delay={0.2}>
          <p className="text-base md:text-xl text-sepia max-w-3xl leading-relaxed mb-6">
            Kdo má pozici v ChatGPT, Perplexity a Gemini dnes, bude ji mít, až tam za dva roky půjde celá jeho cílovka.
            Bez milionových rozpočtů. Bez pětiletého budování zpětných odkazů. Jen s lepší odpovědí.
          </p>

          <p className="text-sm md:text-base text-sandstone max-w-3xl leading-relaxed mb-10 md:mb-12">
            <span className="font-mono text-caramel">GEO</span> (Generative Engine Optimization) — disciplína, která Váš obsah dostane do odpovědí umělé inteligence.
          </p>
        </RevealOnScroll>

        <RevealOnScroll delay={0.3}>
          <div className="flex flex-col sm:flex-row flex-wrap gap-4 mb-16 md:mb-20">
            <a
              href="#audit-zdarma"
              className="bg-caramel text-espresso px-6 md:px-8 py-4 font-mono text-xs uppercase tracking-widest font-bold hover:bg-caramel-light transition-all shadow-xl inline-flex items-center justify-center gap-2"
            >
              Vyšetříme Váš případ zdarma <ArrowRight size={14} />
            </a>
            <a
              href="#co-je-geo"
              className="border border-caramel/30 text-caramel px-6 md:px-8 py-4 font-mono text-xs uppercase tracking-widest hover:bg-caramel/10 transition-all inline-flex items-center justify-center gap-2"
            >
              Co je vlastně GEO? <ArrowDown size={14} />
            </a>
          </div>
        </RevealOnScroll>

        {/* Metriky */}
        <StaggerGrid
          className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-tobacco border border-tobacco"
          staggerDelay={0.08}
        >
          {metrics.map((m) => (
            <div key={m.label} className="bg-espresso p-5 md:p-8">
              <div className="font-display font-black text-2xl md:text-4xl text-caramel mb-2">
                {m.number}
              </div>
              <p className="font-mono text-[10px] uppercase tracking-widest text-sandstone leading-snug">
                {m.label}
              </p>
            </div>
          ))}
        </StaggerGrid>
      </div>
    </section>
  );
}
