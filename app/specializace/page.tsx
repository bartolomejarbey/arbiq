import DetectiveTag from "@/components/shared/DetectiveTag";
import Link from "next/link";
import { Search, Hammer, Wrench, Lightbulb } from "lucide-react";

const services = [
  {
    id: "vysetreni",
    number: "01",
    icon: Search,
    label: "VYŠETŘOVÁNÍ",
    name: "Rentgen",
    tagline: "Hodinový hluboký audit, který odhalí, co Vás stojí peníze.",
    bg: "bg-espresso",
    paragraphs: [
      "Rentgen je naše vlajková služba. Jedna hodina, během které projdeme Váš web, marketing, analytiku a business model. Hledáme konkrétní problémy — ne obecné rady, které si přečtete v každém článku na internetu.",
      "Výstupem je písemný report s prioritizovaným seznamem nálezů. Každý nález má popis problému, dopad na Váš business a konkrétní doporučení, jak ho opravit. Žádné mlžení.",
      "Po reportu následuje 30minutová konzultace, kde projdeme výsledky a zodpovíme Vaše otázky. Pokud se rozhodnete pokračovat s námi, cena Rentgenu se Vám odečte od první zakázky.",
    ],
    price: "[CENA] KČ",
    cta: { label: "Objednat Rentgen", href: "/rentgen" },
  },
  {
    id: "stavba",
    number: "02",
    icon: Hammer,
    label: "ZAJIŠTĚNÍ MÍSTA ČINU",
    name: "Stavba webů",
    tagline: "Weby, které prodávají. Bez šablon. Bez závislosti na nás.",
    bg: "bg-coffee",
    paragraphs: [
      "Stavíme weby od základu. Každý projekt začíná analýzou — kdo je Váš zákazník, co hledá, a proč by měl zůstat právě u Vás. Teprve pak kreslíme wireframy a píšeme kód.",
      "Používáme moderní technologie: Next.js, Tailwind, Vercel. Nebo WordPress, pokud dává smysl. Vždy volíme stack podle projektu, ne podle toho, co je zrovna trendy.",
      "Každý web předáváme s dokumentací a zaškolením. Nechceme, abyste byli na nás závislí. Chceme, abyste si web mohli spravovat sami — a vrátili se jen když budete potřebovat něco nového.",
    ],
    price: "OD [CENA] KČ",
    cta: { label: "Domluvit projekt", href: "/kontakt" },
  },
  {
    id: "nastroje",
    number: "03",
    icon: Wrench,
    label: "DETEKTIVOVO VYBAVENÍ",
    name: "Nástroje",
    tagline: "SaaS produkty pro opakující se problémy v českém digitálním světě.",
    bg: "bg-espresso",
    paragraphs: [
      "Některé problémy potkáváme u každého druhého klienta. Proto jsme pro ně vytvořili hotové nástroje — SaaS produkty, které řeší konkrétní bolest bez nutnosti stavět cokoliv na míru.",
      "Webiq analyzuje výkon Vašeho webu. Finatiq hlídá finanční zdraví projektu. Pamatiq spravuje poznámky a dokumentaci. Reklamiq optimalizuje reklamní rozpočty.",
      "Každý nástroj je navržen tak, aby ho zvládl používat i netechnický člověk. Žádné dashboardy plné grafů, kterým nikdo nerozumí. Jen jasné odpovědi na jasné otázky.",
    ],
    price: "OD [CENA] KČ/MĚSÍC",
    cta: { label: "Prozkoumat nástroje", href: "/kontakt" },
  },
  {
    id: "konzultace",
    number: "04",
    icon: Lightbulb,
    label: "DRUHÝ NÁZOR",
    name: "Konzultace",
    tagline: "Expertní pohled na Váš startup, business model nebo strategii.",
    bg: "bg-coffee",
    paragraphs: [
      "Někdy nepotřebujete nový web ani audit. Potřebujete někoho, kdo se podívá na Váš problém zvenčí a řekne Vám pravdu. Bez diplomatických obálek.",
      "Konzultace je hodinový hovor, kde projdeme Váš konkrétní problém. Může to být business model, cenová strategie, technické rozhodnutí, nebo otázka typu \u201Emám to celé zahodit a začít znovu?\u201C.",
      "Neříkáme Vám, co chcete slyšet. Říkáme Vám, co potřebujete slyšet. A pak Vám pomůžeme udělat správné rozhodnutí — i kdyby to znamenalo, že u nás nic nekoupíte.",
    ],
    price: "[CENA] KČ/HOD",
    cta: { label: "Domluvit konzultaci", href: "/kontakt" },
  },
];

export default function SpecializacePage() {
  return (
    <div className="pt-32">
      <div className="max-w-7xl mx-auto px-6 md:px-12 mb-20">
        <DetectiveTag className="mb-4">DETEKTIVOVY NÁSTROJE</DetectiveTag>
        <h1 className="font-display font-black text-moonlight text-4xl md:text-6xl lg:text-7xl mb-6">
          Co děláme
        </h1>
        <p className="text-sepia/70 max-w-2xl text-lg">
          Čtyři nástroje v kufříku jednoho detektiva. Každý nabroušen pro jiný typ digitálního zločinu.
        </p>
      </div>

      {services.map((s) => {
        const Icon = s.icon;
        return (
          <section key={s.id} id={s.id} className={`${s.bg} py-24 md:py-32`}>
            <div className="max-w-7xl mx-auto px-6 md:px-12">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
                <div className="lg:col-span-2">
                  <span className="font-mono text-7xl md:text-8xl text-caramel/20 font-bold leading-none">
                    {s.number}
                  </span>
                </div>
                <div className="lg:col-span-10">
                  <div className="flex items-center gap-4 mb-6">
                    <Icon size={36} className="text-caramel" strokeWidth={1.5} />
                    <span className="font-mono text-[10px] uppercase tracking-widest text-sandstone">
                      {s.label}
                    </span>
                  </div>

                  <h2 className="font-display font-black text-moonlight text-4xl md:text-5xl mb-4">
                    {s.name}
                  </h2>

                  <p className="text-caramel font-serif-alt text-lg mb-10">
                    {s.tagline}
                  </p>

                  <div className="space-y-6 text-sepia/80 leading-relaxed max-w-3xl mb-10">
                    {s.paragraphs.map((p, i) => (
                      <p key={i}>{p}</p>
                    ))}
                  </div>

                  <div className="flex flex-wrap items-center gap-6 pt-8 border-t border-caramel/20">
                    <span className="font-mono text-sm text-caramel tracking-wider">
                      {s.price}
                    </span>
                    <Link
                      href={s.cta.href}
                      className="bg-caramel text-espresso px-8 py-4 font-mono text-xs uppercase tracking-widest font-bold hover:bg-caramel-light transition-all shadow-xl"
                    >
                      {s.cta.label}
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </section>
        );
      })}
    </div>
  );
}
