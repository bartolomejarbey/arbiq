import Link from "next/link";
import DetectiveTag from "@/components/shared/DetectiveTag";
import MarkerUnderline from "@/components/shared/MarkerUnderline";
import Typewriter from "@/components/shared/Typewriter";
import {
  ArrowRight,
  ExternalLink,
  PenTool,
  Layers,
  MessageSquare,
  Printer,
  Megaphone,
  Image as ImageIcon,
} from "lucide-react";

// Sesterská grafická agentura — jednoduše měnitelná doména.
const GRAPHIQ_URL = "https://graphiq.cz";

const offerings = [
  { icon: PenTool, name: "Logo a značka", desc: "Logotyp a varianty pro web i tisk." },
  { icon: Layers, name: "Vizuální identita", desc: "Barvy, písma, styl, brand manuál." },
  { icon: MessageSquare, name: "Sociální sítě", desc: "Posty, stories, šablony, konzistentní feed." },
  { icon: Printer, name: "Tiskoviny", desc: "Vizitky, letáky, brožury, plakáty." },
  { icon: Megaphone, name: "Reklamní kreativa", desc: "Bannery a vizuály pro PPC a Meta." },
  { icon: ImageIcon, name: "Polepy a outdoor", desc: "Polepy, roll-upy, billboardy, eventová grafika." },
];

export default function GrafikaPage() {
  return (
    <div className="pt-32">
      {/* HERO */}
      <section className="pb-20 px-6 md:px-12">
        <div className="max-w-7xl mx-auto">
          <div className="max-w-3xl">
            <DetectiveTag className="mb-8">GRAFIKA · GRAPHIQ.CZ</DetectiveTag>
            <h1 className="font-display font-black text-moonlight text-5xl md:text-7xl leading-[0.9] mb-8">
              Naše grafická <MarkerUnderline>agentura</MarkerUnderline>.
            </h1>
            <p className="text-lg md:text-xl text-sepia max-w-2xl leading-relaxed mb-10">
              <Typewriter text="Grafiku řešíme přes naši sesterskou značku Graphiq.cz — od loga a vizuální identity po sociální sítě, tiskoviny a reklamu. Všechno možný umíme." />
            </p>
            <a
              href={GRAPHIQ_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-caramel text-espresso px-8 py-4 font-mono text-xs uppercase tracking-widest font-bold hover:bg-caramel-light transition-all inline-flex items-center gap-2"
            >
              Přejít na Graphiq.cz <ExternalLink size={14} />
            </a>
          </div>
        </div>
      </section>

      {/* CO UMÍME */}
      <section className="py-24 bg-coffee">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <DetectiveTag className="mb-4">CO UMÍME</DetectiveTag>
          <h2 className="font-display font-black text-moonlight text-3xl md:text-5xl mb-12">
            Grafika od A do Z
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {offerings.map((o) => {
              const Icon = o.icon;
              return (
                <div key={o.name} className="bg-espresso border border-tobacco p-7 hover:border-caramel transition-colors duration-300 flex flex-col">
                  <Icon size={30} className="text-caramel mb-5" strokeWidth={1.5} />
                  <h3 className="font-display font-bold text-xl text-moonlight mb-2">{o.name}</h3>
                  <p className="text-sm text-sepia/80 leading-relaxed">{o.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* REFERENCE */}
      <section className="py-24 bg-espresso">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <DetectiveTag className="mb-4">REFERENCE</DetectiveTag>
          <h2 className="font-display font-black text-moonlight text-3xl md:text-5xl mb-12">
            Ukázky z naší práce
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((n) => (
              <figure key={n} className="bg-coffee border border-tobacco overflow-hidden">
                {/* TODO: po dodání screenů sem přijde <Image src={`/reference/grafika-${n}.png`} ... /> */}
                <div className="aspect-[4/3] flex items-center justify-center bg-tobacco/30 text-sandstone/50">
                  <div className="text-center">
                    <ImageIcon size={32} className="mx-auto mb-2 opacity-50" />
                    <span className="font-mono text-[10px] uppercase tracking-widest">Reference 0{n}</span>
                  </div>
                </div>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* CTA → Graphiq.cz */}
      <section className="py-24 bg-parchment paper-texture text-espresso-text text-center">
        <div className="max-w-3xl mx-auto px-6 md:px-12">
          <DetectiveTag variant="light" className="mb-4 inline-block">GRAPHIQ.CZ</DetectiveTag>
          <h2 className="font-display font-black text-espresso-text text-3xl md:text-5xl mb-6">
            Celé portfolio a ceník najdete na Graphiq.cz
          </h2>
          <p className="text-brown-muted text-sm mb-10 max-w-xl mx-auto leading-relaxed">
            Kompletní ukázky, balíčky a poptávkový formulář jsou na webu naší grafické agentury.
          </p>
          <a
            href={GRAPHIQ_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-espresso text-parchment px-10 py-5 font-mono text-xs uppercase tracking-widest font-bold hover:bg-espresso/90 transition-all inline-flex items-center gap-2"
          >
            Otevřít Graphiq.cz <ExternalLink size={14} />
          </a>
          <div className="mt-8">
            <Link href="/rentgen" className="text-brown-muted hover:text-espresso-text text-sm font-mono uppercase tracking-widest inline-flex items-center gap-2 transition-colors">
              Nebo nezávazná konzultace <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
