import Link from "next/link";
import { ArrowRight, Phone, Flame, Target, Wallet, TrendingUp, Headphones, MapPin, Clock, CheckCircle2 } from "lucide-react";
import DetectiveTag from "@/components/shared/DetectiveTag";
import RevealOnScroll from "@/components/shared/RevealOnScroll";
import MarkerUnderline from "@/components/shared/MarkerUnderline";
import WaxSeal from "@/components/shared/WaxSeal";

const SPLIT = [
  {
    pct: "30 %",
    title: "Cold calls",
    text: "Telefonát novým firmám které nás ještě neznají. Skript pro tebe máme připravený a CRM ti drží přehled.",
    icon: Phone,
  },
  {
    pct: "30 %",
    title: "Hot leads",
    text: "Kvalifikované poptávky které jsme přes obsah a referenci ohřáli. Stačí dovést k nabídce a podpisu.",
    icon: Flame,
  },
  {
    pct: "40 %",
    title: "Meta Ads poptávky",
    text: "Lidé kteří kliknuli na naši reklamu, vyplnili formulář a CHTĚJÍ web/marketing/automatizaci. Volej je do 60 sekund — Reklamiq ti pošle SMS.",
    icon: Target,
  },
];

const COMPENSATION = [
  {
    icon: Wallet,
    title: "Fix 30 000 – 50 000 Kč / měsíc",
    text: "Podle zkušeností a předchozích výsledků v B2B prodeji. Žádné podmínky typu 'minimum 10 schůzek týdně', důvěřujeme dospělým lidem.",
  },
  {
    icon: TrendingUp,
    title: "Férová provize z prodaných služeb",
    text: "Procento z první faktury každého klienta kterého přivedeš. Konkrétní výši probereme na pohovoru — chceme aby ti to dávalo smysl.",
  },
  {
    icon: Headphones,
    title: "Continuelní fee = pasivní příjem",
    text: "Z měsíčních paušálů klientů (SEO, paušál na automatizaci, hosting aplikací) dostáváš dlouhodobé procento. Po půl roce máš stálý pasivní příjem, který roste s každým novým klientem.",
  },
];

const REQUIREMENTS = [
  "Telefon ti není cizí — voláš bez ostychu a umíš poslouchat.",
  "Zkušenost v B2B prodeji (alespoň rok). Pokud jsi prodával(a) v jiném oboru, ale s konkrétními výsledky, taky napiš.",
  "Umíš si držet rytmus bez micromanagementu. Žádné checky každý den.",
  "Nebojíš se říct cenu. Když vidíš nesedící poptávku, řekneš to.",
  "Češtinu na úrovni rodilého mluvčího, angličtinu na úrovni která ti nezabrání číst dokumentaci.",
];

const OFFERS = [
  "CRM s automatizovaným ohřevem leadů — vidíš historii každého kontaktu na jedno klepnutí.",
  "Marketingový support — Meta Ads ti přivede teplé poptávky každý den.",
  "Práce odkudkoliv — kavárna, doma, na Bali. Žádné povinné docházky.",
  "Vlastní detektivní agentura za zády — nejsi anonymní call centrum, máš za sebou tým co dodá.",
  "Continuelní fee — buduješ si vlastní portfolio. Čím déle tu jsi, tím větší pasivní příjem.",
];

export default function KarieraPage() {
  return (
    <main className="bg-espresso min-h-screen pt-32 pb-24 text-sepia">
      {/* HERO */}
      <section className="px-6 md:px-12 mb-24">
        <div className="max-w-5xl mx-auto">
          <RevealOnScroll>
            <DetectiveTag className="mb-6">KARIÉRA · OTEVŘENÁ POZICE</DetectiveTag>
            <h1 className="font-display font-black text-moonlight text-4xl md:text-6xl lg:text-7xl mb-8 leading-[1.05]">
              Hledáme <MarkerUnderline>obchodního zástupce</MarkerUnderline>
            </h1>
            <p className="text-sepia/85 text-lg md:text-xl max-w-3xl leading-relaxed mb-8">
              B2B prodej celého portfolia ARBIQ. Fix + férové provize + <strong className="text-caramel">continuelní fee z paušálů klientů</strong> — buduješ si pasivní příjem který poroste každý měsíc co tady budeš.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <a
                href="mailto:bartolomej@arbiq.cz?subject=Kari%C3%A9ra%20%E2%80%94%20Obchodn%C3%AD%20z%C3%A1stupce&body=Jmenuji%20se%20...%20a%20m%C3%A1m%20z%C3%A1jem%20o%20pozici.%20Voln%C3%BD%20text%2C%20telefon%2C%20CV%20%2F%20LinkedIn%20m%C5%AF%C5%BEete%20p%C5%99idat%20do%20zpr%C3%A1vy."
                className="inline-flex items-center gap-2 bg-caramel text-espresso px-8 py-4 font-mono text-xs uppercase tracking-widest font-bold hover:bg-caramel-light transition-all"
              >
                Mám zájem — pošlu CV <ArrowRight size={14} />
              </a>
              <Link
                href="/tym"
                className="inline-flex items-center gap-2 border border-caramel/40 text-caramel hover:bg-caramel/10 px-8 py-4 font-mono text-xs uppercase tracking-widest transition-all"
              >
                Koho potkáš v týmu
              </Link>
            </div>
          </RevealOnScroll>
        </div>
      </section>

      {/* DENNÍ NÁPLŇ */}
      <section className="px-6 md:px-12 mb-24">
        <div className="max-w-6xl mx-auto">
          <RevealOnScroll>
            <DetectiveTag className="mb-4">DENNÍ NÁPLŇ</DetectiveTag>
            <h2 className="font-display italic font-black text-3xl md:text-4xl text-moonlight mb-12">
              Tři kanály, jasný poměr
            </h2>
          </RevealOnScroll>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {SPLIT.map((item, i) => {
              const Icon = item.icon;
              return (
                <RevealOnScroll key={i} delay={i * 0.1}>
                  <div className="bg-coffee border-l-4 border-caramel p-8 h-full hover:-translate-y-1 transition-transform duration-500">
                    <Icon size={28} className="text-caramel mb-4" strokeWidth={1.5} />
                    <div className="font-display italic font-black text-5xl text-caramel mb-2">{item.pct}</div>
                    <div className="font-mono text-[10px] uppercase tracking-widest text-sandstone mb-3">{item.title}</div>
                    <p className="text-sepia/80 text-sm leading-relaxed">{item.text}</p>
                  </div>
                </RevealOnScroll>
              );
            })}
          </div>
        </div>
      </section>

      {/* ODMĚŇOVÁNÍ */}
      <section className="px-6 md:px-12 mb-24">
        <div className="max-w-5xl mx-auto">
          <RevealOnScroll>
            <DetectiveTag className="mb-4">ODMĚŇOVÁNÍ</DetectiveTag>
            <h2 className="font-display italic font-black text-3xl md:text-4xl text-moonlight mb-4">
              Tři vrstvy — fix, provize, paušál
            </h2>
            <p className="text-sepia/70 max-w-3xl mb-12">
              Většina agentur ti dá fix a sleduje cizí krevní oběh. My chceme aby ses bavil(a) s vlastním portfoliem — proto třetí vrstva (continuelní fee) je pro nás stejně důležitá jako provize z první faktury.
            </p>
          </RevealOnScroll>
          <div className="space-y-5">
            {COMPENSATION.map((item, i) => {
              const Icon = item.icon;
              return (
                <RevealOnScroll key={i} delay={i * 0.08}>
                  <div className="bg-coffee p-8 flex flex-col md:flex-row gap-6 items-start hover:bg-coffee/90 transition-colors">
                    <Icon size={32} className="text-caramel shrink-0" strokeWidth={1.5} />
                    <div className="flex-1">
                      <h3 className="font-display italic font-black text-2xl text-moonlight mb-2">{item.title}</h3>
                      <p className="text-sepia/80 leading-relaxed">{item.text}</p>
                    </div>
                  </div>
                </RevealOnScroll>
              );
            })}
          </div>
        </div>
      </section>

      {/* KOHO HLEDÁME + CO NABÍZÍME */}
      <section className="px-6 md:px-12 mb-24">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12">
          <RevealOnScroll>
            <DetectiveTag className="mb-4">KOHO HLEDÁME</DetectiveTag>
            <h2 className="font-display italic font-black text-3xl text-moonlight mb-8">Co od tebe čekáme</h2>
            <ul className="space-y-4">
              {REQUIREMENTS.map((r, i) => (
                <li key={i} className="flex items-start gap-3">
                  <CheckCircle2 size={20} className="text-caramel mt-0.5 shrink-0" strokeWidth={1.5} />
                  <span className="text-sepia/85 leading-relaxed">{r}</span>
                </li>
              ))}
            </ul>
          </RevealOnScroll>
          <RevealOnScroll delay={0.1}>
            <DetectiveTag className="mb-4">CO U NÁS DOSTANEŠ</DetectiveTag>
            <h2 className="font-display italic font-black text-3xl text-moonlight mb-8">Co tě tady čeká</h2>
            <ul className="space-y-4">
              {OFFERS.map((o, i) => (
                <li key={i} className="flex items-start gap-3">
                  <CheckCircle2 size={20} className="text-olive mt-0.5 shrink-0" strokeWidth={1.5} />
                  <span className="text-sepia/85 leading-relaxed">{o}</span>
                </li>
              ))}
            </ul>
          </RevealOnScroll>
        </div>
      </section>

      {/* DETAILY */}
      <section className="px-6 md:px-12 mb-24">
        <div className="max-w-5xl mx-auto bg-coffee p-8 md:p-12">
          <RevealOnScroll>
            <DetectiveTag className="mb-4">PRAKTICKÉ DETAILY</DetectiveTag>
            <h2 className="font-display italic font-black text-3xl text-moonlight mb-8">Jak to bude vypadat</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div>
                <MapPin size={20} className="text-caramel mb-3" strokeWidth={1.5} />
                <div className="font-mono text-[10px] uppercase tracking-widest text-sandstone mb-1">Místo</div>
                <p className="text-moonlight">Plně remote</p>
                <p className="text-sepia/60 text-sm mt-1">Kavárna, doma, coworking — kde se ti chce.</p>
              </div>
              <div>
                <Clock size={20} className="text-caramel mb-3" strokeWidth={1.5} />
                <div className="font-mono text-[10px] uppercase tracking-widest text-sandstone mb-1">Úvazek</div>
                <p className="text-moonlight">HPP nebo OSVČ</p>
                <p className="text-sepia/60 text-sm mt-1">Plný úvazek doporučujeme. Otevřeni i DPP/zkrácenému, řeknete si na pohovoru.</p>
              </div>
              <div>
                <TrendingUp size={20} className="text-caramel mb-3" strokeWidth={1.5} />
                <div className="font-mono text-[10px] uppercase tracking-widest text-sandstone mb-1">Růst</div>
                <p className="text-moonlight">Senior po roce</p>
                <p className="text-sepia/60 text-sm mt-1">Když budeš nosit výsledky, otevřeme cestu k Key Account roli.</p>
              </div>
            </div>
          </RevealOnScroll>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 md:px-12">
        <div className="max-w-3xl mx-auto text-center">
          <RevealOnScroll>
            <div className="flex justify-center mb-8">
              <WaxSeal text="ARBIQ" />
            </div>
            <h2 className="font-display font-black text-3xl md:text-5xl text-moonlight mb-6 leading-tight">
              Sedí to na tebe?
            </h2>
            <p className="text-sepia/75 text-lg mb-10 leading-relaxed">
              Napiš nám CV nebo LinkedIn + krátký pitch: <em>„Kdybyste prodával(a) ARBIQ kamarádovi co má web a chce růst, jak byste začal(a)?"</em>{' '}
              Žádný formální motivační dopis, stačí 3–5 vět.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="mailto:bartolomej@arbiq.cz?subject=Kari%C3%A9ra%20%E2%80%94%20Obchodn%C3%AD%20z%C3%A1stupce&body=Jmenuji%20se%20...%0A%0AVoln%C3%BD%20pitch%20(3%E2%80%935%20v%C4%9Bt)%3A%20...%0A%0ATelefon%3A%20...%0ALinkedIn%2FCV%3A%20...%0A%0ATe%C5%A1%C3%ADm%20se."
                className="inline-flex items-center gap-2 bg-caramel text-espresso px-10 py-5 font-mono text-xs uppercase tracking-widest font-bold hover:bg-caramel-light transition-all"
              >
                Pošlu CV na bartolomej@arbiq.cz <ArrowRight size={14} />
              </a>
              <Link
                href="/kontakt"
                className="inline-flex items-center gap-2 border border-caramel/40 text-caramel hover:bg-caramel/10 px-10 py-5 font-mono text-xs uppercase tracking-widest transition-all"
              >
                Mám otázku
              </Link>
            </div>
            <p className="text-sandstone/60 text-xs font-mono mt-10">
              Odpovídáme do 24 hodin · Pohovor 30 min online · Reálná zkušební úloha (telefonát s fiktivním leadem)
            </p>
          </RevealOnScroll>
        </div>
      </section>
    </main>
  );
}
