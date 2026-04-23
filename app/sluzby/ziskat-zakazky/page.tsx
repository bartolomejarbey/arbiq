import Link from "next/link";
import DetectiveTag from "@/components/shared/DetectiveTag";
import MarkerUnderline from "@/components/shared/MarkerUnderline";
import { ArrowRight, Search, BarChart3, Rocket, RefreshCw } from "lucide-react";

const steps = [
  { icon: Search, title: "Rentgen", desc: "Zjistíme, kde ztrácíte zákazníky a peníze." },
  { icon: BarChart3, title: "Strategie", desc: "Navrhneme plán, který dává smysl pro Váš rozpočet." },
  { icon: Rocket, title: "Realizace", desc: "Spustíme kampaně, optimalizujeme web, stavíme funnely." },
  { icon: RefreshCw, title: "Optimalizace", desc: "Měříme, testujeme, zlepšujeme. Každý měsíc." },
];

export default function ZiskatZakazkyPage() {
  return (
    <div className="pt-32">
      {/* HERO */}
      <section className="pb-24 px-6 md:px-12">
        <div className="max-w-7xl mx-auto">
          <div className="max-w-3xl">
            <DetectiveTag className="mb-8">ZÍSKAT ZAKÁZKY</DetectiveTag>
            <h1 className="font-display font-black text-moonlight text-5xl md:text-7xl leading-[0.9] mb-8">
              Web bez marketingu je billboard v <MarkerUnderline>lese</MarkerUnderline>.
            </h1>
            <p className="text-lg md:text-xl text-sepia max-w-2xl leading-relaxed">
              Přivedeme Vám zákazníky. A naučíme Váš web je nepustit.
            </p>
          </div>
        </div>
      </section>

      {/* CO DĚLÁME */}
      <section className="py-24 bg-coffee">
        <div className="max-w-4xl mx-auto px-6 md:px-12">
          <DetectiveTag className="mb-4">NAŠE ZBRANĚ</DetectiveTag>
          <h2 className="font-display font-black text-moonlight text-3xl md:text-5xl mb-12">
            Co děláme
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {["PPC (Google Ads, Sklik)", "Meta Ads", "SEO", "E-mailing", "Sociální sítě"].map((s) => (
              <div key={s} className="bg-espresso border border-tobacco p-6 text-center hover:border-caramel/50 transition-colors">
                <span className="text-caramel font-mono text-base md:text-lg uppercase tracking-wider font-bold">{s}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* JAK TO FUNGUJE */}
      <section className="py-24 bg-espresso">
        <div className="max-w-5xl mx-auto px-6 md:px-12">
          <DetectiveTag className="mb-4">POSTUP</DetectiveTag>
          <h2 className="font-display font-black text-moonlight text-3xl md:text-5xl mb-16">
            Jak to funguje
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {steps.map((s) => {
              const Icon = s.icon;
              return (
                <div key={s.title} className="text-center">
                  <div className="w-16 h-16 bg-coffee border border-tobacco flex items-center justify-center mx-auto mb-4">
                    <Icon size={28} className="text-caramel" strokeWidth={1.5} />
                  </div>
                  <h3 className="font-display font-bold text-xl text-moonlight mb-2">{s.title}</h3>
                  <p className="text-sepia/80 text-sm leading-relaxed">{s.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* PROČ MY */}
      <section className="py-24 bg-parchment paper-texture text-espresso-text">
        <div className="max-w-3xl mx-auto px-6 md:px-12">
          <DetectiveTag variant="light" className="mb-4">PROČ MY</DetectiveTag>
          <h2 className="font-display font-black text-espresso-text text-3xl md:text-5xl mb-10">
            Proč zrovna ARBIQ
          </h2>
          <div className="text-brown-muted leading-relaxed space-y-4 text-lg">
            <p>
              Velká agentura sice bere i menší klienty — ale seniorní specialista nepracuje s rozpočtem pod sto tisíc měsíčně, a sazby za správu jsou nastavené pro velké klienty bez ohledu na ty malé. My jsme jiní. Víme, jak vytěžit maximum z malého rozpočtu, protože pro to jsme stavěni.
            </p>
            <p>
              Každá koruna musí pracovat. A my umíme donutit korunu dělat přesčas.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-espresso text-center">
        <div className="max-w-3xl mx-auto px-6 md:px-12">
          <Link
            href="/rentgen"
            className="bg-caramel text-espresso px-10 py-5 font-mono text-xs uppercase tracking-widest font-bold hover:bg-caramel-light transition-all shadow-xl inline-flex items-center gap-2"
          >
            Chci víc zakázek <ArrowRight size={14} />
          </Link>
        </div>
      </section>
    </div>
  );
}
