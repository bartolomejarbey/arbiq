import Link from "next/link";
import DetectiveTag from "@/components/shared/DetectiveTag";
import MarkerUnderline from "@/components/shared/MarkerUnderline";
import Typewriter from "@/components/shared/Typewriter";
import { ArrowRight, CheckCircle } from "lucide-react";

const features = [
  "Unikátní design — žádné šablony",
  "SEO-ready struktura — připraveno pro dohledatelnost",
  "Responzivní — funguje na mobilu, tabletu, desktopu",
  "Webiq plugin — úpravy textu kliknutím, bez programování",
  "30min zaškolení — budete si web spravovat sami",
  "Měření v ceně — Plausible nebo GA4 nastavené od prvního dne, víte co funguje",
];

export default function WeboveStrankyPage() {
  return (
    <div className="pt-32">
      {/* HERO */}
      <section className="pb-24 px-6 md:px-12">
        <div className="max-w-7xl mx-auto">
          <div className="max-w-3xl">
            <DetectiveTag className="mb-8">WEBOVÉ STRÁNKY</DetectiveTag>
            <h1 className="font-display font-black text-moonlight text-5xl md:text-7xl leading-[0.9] mb-8">
              Web, který neprodává, je drahá <MarkerUnderline>vizitka</MarkerUnderline>.
            </h1>
            <p className="text-lg md:text-xl text-sepia max-w-2xl leading-relaxed">
              <Typewriter text="Stavíme weby, které vypadají jako práce profesionála, fungují jako prodejní stroj, a Vy si je můžete upravovat sami." />
            </p>
          </div>
        </div>
      </section>

      {/* PROČ NE WEBY OD AI */}
      <section className="py-24 bg-coffee">
        <div className="max-w-4xl mx-auto px-6 md:px-12">
          <DetectiveTag className="mb-4">DŮKAZ A</DetectiveTag>
          <h2 className="font-display font-black text-moonlight text-3xl md:text-5xl mb-10">
            Proč ne weby od AI
          </h2>
          {/* Default/zkušenější version */}
          <div className="bg-espresso border border-tobacco p-8 md:p-10 text-sepia/80 leading-relaxed space-y-4">
            <p>
              Levné agentury Vám slíbí moderní web za pět tisíc. Dostanete šablonu, kterou má dalších dvě stě firem. Žádné SEO, žádné měření, žádnou kontrolu nad obsahem.
            </p>
            <p>
              My stavíme weby, které jsou technicky připravené prodávat. Samy o sobě ale neprodávají — k tomu potřebujete marketing a SEO. Rozdíl je v tom, že naše weby tu práci nezmaří.
            </p>
          </div>
        </div>
      </section>

      {/* CO DOSTANETE */}
      <section className="py-24 bg-espresso">
        <div className="max-w-4xl mx-auto px-6 md:px-12">
          <DetectiveTag className="mb-4">CO DOSTANETE</DetectiveTag>
          <h2 className="font-display font-black text-moonlight text-3xl md:text-5xl mb-12">
            Každý web obsahuje
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {features.map((f) => (
              <div key={f} className="flex items-start gap-3 bg-coffee border border-tobacco p-5">
                <CheckCircle size={18} className="text-caramel shrink-0 mt-0.5" />
                <span className="text-sepia/80 text-sm">{f}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CENÍK */}
      <section className="py-24 bg-parchment paper-texture text-espresso-text">
        <div className="max-w-4xl mx-auto px-6 md:px-12">
          <DetectiveTag variant="light" className="mb-4">CENÍK</DetectiveTag>
          <h2 className="font-display font-black text-espresso-text text-3xl md:text-5xl mb-12">
            Kolik to stojí
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
            <div className="bg-parchment-aged/50 border border-parchment-stain p-10 text-center flex flex-col min-h-[18rem]">
              <h3 className="font-display font-bold text-2xl text-espresso-text mb-4">Web</h3>
              <p className="font-display font-black text-4xl text-espresso-text mb-6">6 — 8 000 Kč</p>
              <p className="text-brown-muted text-sm mt-auto leading-relaxed">Vícestránkový web, kontaktní formulář, responzivní design</p>
            </div>
            <div className="bg-parchment-aged/70 border-2 border-espresso-text/30 p-10 text-center flex flex-col min-h-[18rem] shadow-lg">
              <h3 className="font-display font-bold text-2xl text-espresso-text mb-4">E-shop</h3>
              <p className="font-display font-black text-4xl text-espresso-text mb-6">8 — 20 000 Kč</p>
              <p className="text-brown-muted text-sm mt-auto leading-relaxed">Produktový katalog, platby, správa objednávek</p>
            </div>
            <div className="bg-parchment-aged/50 border border-parchment-stain p-10 text-center flex flex-col min-h-[18rem]">
              <h3 className="font-display font-bold text-2xl text-espresso-text mb-4">SEO</h3>
              <p className="font-display font-black text-4xl text-espresso-text mb-6">4 — 8 000 Kč/měs</p>
              <p className="text-brown-muted text-sm mt-auto leading-relaxed">Dohledatelnost ve vyhledávačích, výsledky za 3–6 měsíců</p>
            </div>
          </div>
          <p className="text-brown-muted text-sm text-center mt-8">
            Cena webu nezahrnuje příplatkové služby (vícejazyčnost, integrace s externími systémy apod.).
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-espresso text-center">
        <div className="max-w-3xl mx-auto px-6 md:px-12">
          <Link
            href="/rentgen"
            className="bg-caramel text-espresso px-10 py-5 font-mono text-xs uppercase tracking-widest font-bold hover:bg-caramel-light transition-all shadow-xl inline-flex items-center gap-2"
          >
            Chci web, který prodává <ArrowRight size={14} />
          </Link>
        </div>
      </section>
    </div>
  );
}
