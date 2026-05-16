import DetectiveTag from '@/components/shared/DetectiveTag';
import MarkerUnderline from '@/components/shared/MarkerUnderline';
import { ArrowRight, ArrowDown } from 'lucide-react';

const metrics = [
  { number: '800M+', label: 'uživatelů ChatGPT týdně' },
  { number: '4,4×', label: 'vyšší konverze z AI traffic' },
  { number: '25 %', label: 'Google dotazů končí AI odpovědí' },
  { number: '115 %', label: 'nárůst viditelnosti pro menší weby' },
];

export default function Hero() {
  return (
    <section className="pb-24 pt-8 px-6 md:px-12">
      <div className="max-w-7xl mx-auto">
        <DetectiveTag className="mb-8">NOVÝ PŘÍPAD — GEO &amp; AI VIDITELNOST</DetectiveTag>

        <h1 className="font-display font-black text-moonlight text-4xl md:text-6xl lg:text-7xl leading-[0.95] mb-8 max-w-5xl">
          Vaše konkurence utrácí stovky tisíc měsíčně, aby Vás přebíjela v Googlu.
          <br />
          <span className="text-caramel">
            AI vyhledávání jim právě <MarkerUnderline>smazalo náskok</MarkerUnderline>.
          </span>
        </h1>

        <p className="text-lg md:text-xl text-sepia max-w-3xl leading-relaxed mb-6">
          Kdo má pozici v ChatGPT, Perplexity a Gemini dnes, bude ji mít, až tam za dva roky půjde celá jeho cílovka.
          Bez milionových rozpočtů. Bez pětiletého budování zpětných odkazů. Jen s lepší odpovědí.
        </p>

        <p className="text-base text-sandstone max-w-3xl leading-relaxed mb-12">
          <span className="font-mono text-caramel">GEO</span> (Generative Engine Optimization) — disciplína, která Váš obsah dostane do odpovědí umělé inteligence.
        </p>

        <div className="flex flex-wrap gap-4 mb-20">
          <a
            href="#audit-zdarma"
            className="bg-caramel text-espresso px-8 py-4 font-mono text-xs uppercase tracking-widest font-bold hover:bg-caramel-light transition-all shadow-xl inline-flex items-center gap-2"
          >
            Vyšetříme Váš případ zdarma <ArrowRight size={14} />
          </a>
          <a
            href="#co-je-geo"
            className="border border-caramel/30 text-caramel px-8 py-4 font-mono text-xs uppercase tracking-widest hover:bg-caramel/10 transition-all inline-flex items-center gap-2"
          >
            Co je vlastně GEO? <ArrowDown size={14} />
          </a>
        </div>

        {/* Metriky */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-tobacco border border-tobacco">
          {metrics.map((m) => (
            <div key={m.label} className="bg-espresso p-6 md:p-8">
              <div className="font-display font-black text-3xl md:text-4xl text-caramel mb-2">
                {m.number}
              </div>
              <p className="font-mono text-[10px] uppercase tracking-widest text-sandstone leading-snug">
                {m.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
