import Image from "next/image";
import DetectiveTag from "@/components/shared/DetectiveTag";
import MoreCasesBanner from "@/components/sections/MoreCasesBanner";
import { ExternalLink } from "lucide-react";

const cases = [
  {
    number: "#001",
    name: "xth.cz",
    url: "https://xth.cz",
    screenshot: "/ilustrace/references/xth.png",
    summary: "Property management, 7-stránkový statický web, multi-jazyk CZ/EN/RU, investiční kalkulačka, garance nájemného.",
    tags: ["WEBDESIGN", "MULTI-LANG", "WORDPRESS"],
    rotation: "rotate-[1deg]",
  },
  {
    number: "#002",
    name: "fachmani.org",
    url: "https://fachmani.org",
    screenshot: "/ilustrace/references/fachmani.png",
    summary: "Marketplace pro řemeslníky. Next.js, Supabase, Vercel. Registrace, profily, ARES API, příprava mobilní aplikace.",
    tags: ["NEXT.JS", "SUPABASE", "MARKETPLACE"],
    rotation: "-rotate-[1deg]",
  },
  {
    number: "#003",
    name: "javurek-es.cz",
    url: "https://javurek-es.cz",
    screenshot: "/ilustrace/references/javurek.png",
    summary: "Energetické stavby, EV charging, Náchod. 5 stránek, dark navy/cyan, kontaktní formuláře, Google Maps.",
    tags: ["WEBDESIGN", "B2B", "KONSTRUKCE"],
    rotation: "rotate-[2deg]",
  },
  {
    number: "#004",
    name: "oldspeedcars.cz",
    url: "https://oldspeedcars.cz",
    screenshot: "/ilustrace/references/oldspeedcars.png",
    summary: "Klasická auta, katalog vozidel, galerie, kontaktní formulář, dark theme s automotive estetikou.",
    tags: ["WEBDESIGN", "AUTOMOTIVE", "KATALOG"],
    rotation: "-rotate-[2deg]",
  },
  {
    number: "#005",
    name: "empras.cz",
    url: "https://empras.cz",
    screenshot: "/ilustrace/references/empras.png",
    summary: "Gastronomy tech, 5 stránek, produktový katalog, B2B kontaktní flow, integrace s CRM systémem.",
    tags: ["WEBDESIGN", "GASTRO", "B2B"],
    rotation: "rotate-[1.5deg]",
  },
  {
    number: "#006",
    name: "kolinskyhokej.cz",
    url: "https://kolinskyhokej.cz",
    screenshot: "/ilustrace/references/kolinskyhokej.png",
    summary: "E-shop za cenu 8 000 Kč. Jednoduchý WordPress, dostačující pro účely klienta — připraven na expanzi.",
    tags: ["E-SHOP", "WORDPRESS", "SPORT"],
    rotation: "-rotate-[1.5deg]",
  },
  {
    number: "#007",
    name: "masi-co.cz",
    url: "https://masi-co.cz",
    screenshot: "/ilustrace/references/masi-co.png",
    summary: "E-shop, custom Node.js framework. Moderní design, produktový katalog, platby.",
    tags: ["E-SHOP", "NODE.JS", "CUSTOM"],
    rotation: "rotate-[1deg]",
  },
  {
    number: "#008",
    name: "woodandsteak-eshop.cz",
    url: "https://woodandsteak-eshop.cz",
    screenshot: "/ilustrace/references/woodandsteak.jpg",
    summary: "E-shop, custom Node.js framework. Produktový katalog, správa objednávek.",
    tags: ["E-SHOP", "NODE.JS", "CUSTOM"],
    rotation: "-rotate-[1deg]",
  },
  {
    number: "#009",
    name: "aurahomes.cz",
    url: "https://aurahomes.cz",
    screenshot: "/ilustrace/references/aurahomes.png",
    summary: "Web developerské firmy. Klidná typografie, prezentace projektů, kontaktní flow pro investory. Žádné křiklavé prvky — důraz na řemeslnou kvalitu.",
    tags: ["WEBDESIGN", "DEVELOPER", "PREMIUM"],
    rotation: "rotate-[1deg]",
  },
];

export default function PripadyPage() {
  return (
    <div className="pt-32 pb-24 px-6 md:px-12">
      <div className="max-w-7xl mx-auto">
        <div className="mb-20">
          <DetectiveTag className="mb-4">ARCHIV PŘÍPADŮ</DetectiveTag>
          <h1 className="font-display font-black text-moonlight text-4xl md:text-6xl lg:text-7xl mb-6">
            Všechny vyřešené případy
          </h1>
          <p className="text-sepia/70 max-w-2xl text-lg">
            Každý případ začínal otázkou. Každý skončil výsledkem. Tady je kompletní archiv klientů, kterým jsme pomohli.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-24">
          {cases.map((c) => (
            <div
              key={c.number}
              className={`bg-espresso border-l-4 border-caramel ${c.rotation} hover:rotate-0 transition-all duration-500 shadow-xl overflow-hidden`}
            >
              {c.screenshot ? (
                <div className="relative h-48 border-b border-tobacco">
                  <Image
                    src={c.screenshot}
                    alt={`Screenshot ${c.name}`}
                    fill
                    className="object-cover object-top"
                  />
                </div>
              ) : (
                <div className="h-48 bg-coffee border-b border-tobacco flex items-center justify-center">
                  <span className="font-mono text-[10px] uppercase tracking-widest text-sandstone/40">
                    Screenshot nedostupný
                  </span>
                </div>
              )}
              <div className="p-8">
                <span className="font-mono text-[10px] uppercase tracking-widest text-caramel block mb-4">
                  CASE FILE {c.number}
                </span>
                <h3 className="text-3xl font-display text-moonlight mb-6">
                  {c.name}
                </h3>
                <p className="text-sepia/70 text-sm leading-relaxed mb-6">
                  {c.summary}
                </p>
                <div className="flex flex-wrap gap-2 mb-6">
                  {c.tags.map((t) => (
                    <span key={t} className="bg-coffee px-2 py-1 font-mono text-[9px] text-sandstone tracking-wider">
                      {t}
                    </span>
                  ))}
                </div>
                <div className="flex justify-between items-center pt-4 border-t border-tobacco">
                  <span className="font-mono text-[9px] uppercase tracking-widest text-olive">
                    STATUS: VYŘEŠEN
                  </span>
                  <a
                    href={c.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-[11px] uppercase tracking-widest text-caramel/70 hover:text-caramel inline-flex items-center gap-2 transition-colors"
                  >
                    Navštívit <ExternalLink size={12} />
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <MoreCasesBanner />
    </div>
  );
}
