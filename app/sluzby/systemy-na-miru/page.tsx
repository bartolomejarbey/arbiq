import Link from "next/link";
import DetectiveTag from "@/components/shared/DetectiveTag";
import MarkerUnderline from "@/components/shared/MarkerUnderline";
import Typewriter from "@/components/shared/Typewriter";
import { ArrowRight } from "lucide-react";

const capabilities = ["Webové aplikace", "SaaS produkty", "CRM systémy", "Rezervační systémy", "Klientské zóny", "API integrace"];

const processSteps = [
  { num: "01", title: "Rentgen", desc: "Pochopíme Váš problém a potřeby." },
  { num: "02", title: "Specifikace", desc: "Definujeme co přesně systém bude dělat." },
  { num: "03", title: "Vývoj", desc: "Stavíme, testujeme, iterujeme." },
  { num: "04", title: "Launch", desc: "Spouštíme do produkce s Vaším týmem." },
  { num: "05", title: "Podpora", desc: "Údržba, aktualizace, rozvoj." },
];

export default function SystemyNaMiruPage() {
  return (
    <div className="pt-32">
      {/* HERO */}
      <section className="pb-24 px-6 md:px-12">
        <div className="max-w-7xl mx-auto">
          <div className="max-w-3xl">
            <DetectiveTag className="mb-8">SYSTÉMY NA MÍRU</DetectiveTag>
            <h1 className="font-display font-black text-moonlight text-5xl md:text-7xl leading-[0.9] mb-8">
              Když hotové řešení <MarkerUnderline>nestačí</MarkerUnderline>.
            </h1>
            <p className="text-lg md:text-xl text-sepia max-w-2xl leading-relaxed">
              <Typewriter text="Webové aplikace, SaaS, CRM, klientské zóny — postavíme Vám přesně to, co potřebujete." />
            </p>
          </div>
        </div>
      </section>

      {/* CO UMÍME */}
      <section className="py-24 bg-coffee">
        <div className="max-w-4xl mx-auto px-6 md:px-12">
          <DetectiveTag className="mb-4">SCHOPNOSTI</DetectiveTag>
          <h2 className="font-display font-black text-moonlight text-3xl md:text-5xl mb-12">
            Co umíme postavit
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {capabilities.map((c) => (
              <div key={c} className="bg-espresso border border-tobacco p-6 text-center hover:border-caramel/50 transition-colors">
                <span className="text-caramel font-mono text-base md:text-lg uppercase tracking-wider font-bold">{c}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CASE STUDY FINATIQ */}
      <section className="py-24 bg-parchment paper-texture text-espresso-text">
        <div className="max-w-4xl mx-auto px-6 md:px-12">
          <DetectiveTag variant="light" className="mb-4">PŘÍPADOVÁ STUDIE</DetectiveTag>
          <h2 className="font-display font-black text-espresso-text text-3xl md:text-5xl mb-10">
            Finatiq
          </h2>
          <div className="text-brown-muted leading-relaxed space-y-4 text-lg">
            <p>
              90 % finančních poradenství nemá klientskou zónu. Klient finančního poradce chodí na pět různých portálů.
            </p>
            <p>
              Postavili jsme Finatiq — CRM s klientskou zónou, AI skenováním dokumentů a detekcí příležitostí.
            </p>
            <p>
              Klientovi poradce dává Finatiq všechny smlouvy, dokumenty a komunikaci na jednom místě. Konec přihlašování do pěti portálů. Konec papírů. Vše dostupné odkudkoliv, v reálném čase — z mobilu i počítače.
            </p>
          </div>
        </div>
      </section>

      {/* JAK TO PROBÍHÁ */}
      <section className="py-24 bg-espresso">
        <div className="max-w-5xl mx-auto px-6 md:px-12">
          <DetectiveTag className="mb-4">PROCES</DetectiveTag>
          <h2 className="font-display font-black text-moonlight text-3xl md:text-5xl mb-16">
            Jak to probíhá
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            {processSteps.map((s) => (
              <div key={s.num} className="bg-coffee border border-tobacco p-6">
                <span className="font-mono text-3xl text-caramel/30 font-bold block mb-3">{s.num}</span>
                <h3 className="font-display font-bold text-lg text-moonlight mb-2">{s.title}</h3>
                <p className="text-sepia/70 text-sm leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-coffee text-center">
        <div className="max-w-3xl mx-auto px-6 md:px-12">
          <Link
            href="/kontakt"
            className="bg-caramel text-espresso px-10 py-5 font-mono text-xs uppercase tracking-widest font-bold hover:bg-caramel-light transition-all shadow-xl inline-flex items-center gap-2"
          >
            Mám nápad na systém <ArrowRight size={14} />
          </Link>
        </div>
      </section>
    </div>
  );
}
