"use client";

import { useState } from "react";
import DetectiveTag from "@/components/shared/DetectiveTag";
import RevealOnScroll from "@/components/shared/RevealOnScroll";
import StaggerGrid from "@/components/shared/StaggerGrid";
import Typewriter from "@/components/shared/Typewriter";
import AppDetailModal, { type AppDetail } from "@/components/sections/AppDetailModal";
import { ArrowRight, Eye } from "lucide-react";

type LiveApp = {
  name: string;
  url: string;
  tagline: string;
  description: string;
  highlight: string;
};

const liveApps: LiveApp[] = [
  {
    name: "Pamatiq",
    url: "https://pamatiq.cz",
    tagline: "Připomínkovač do Messengeru a Instagramu",
    description:
      "První nástroj svého druhu v ČR. Automatické připomínky přes Messenger a Instagram — aby Vaši klienti nezapomněli na schůzky, platby ani důležité termíny.",
    highlight: "První svého druhu v ČR",
  },
  {
    name: "Finatiq",
    url: "https://finatiq.cz",
    tagline: "CRM a klientská zóna pro finanční poradce",
    description:
      "První open-source klientská zóna pro finanční poradenství. AI skenování dokumentů, detekce příležitostí, kompletní správa klientů.",
    highlight: "První open-source v oboru",
  },
];

const modalApps: AppDetail[] = [
  {
    name: "Webiq",
    tagline: "Vizuální editor pro kódové weby",
    highlight: "První svého druhu",
    description:
      "První aplikace svého druhu. Upravujte texty, obrázky a obsah přímo na webu — i když je postaven v kódu. Bez programování, bez závislosti na vývojáři.",
    extended: [
      "Klient klikne na text na svém Next.js webu, edituje, uloží — a změna je živá. Funguje stejně jako Squarespace nebo Webflow, ale Váš web zůstává plně kódový. Žádný vendor lock-in, žádná ztráta výkonu, žádný kompromis v SEO.",
    ],
    useCases: [
      "Úprava textů a obrázků bez vývojáře",
      "A/B testování copy bez deploymentu",
      "Sezónní akce a kampaně spuštěné během minut",
      "Aktualizace cen a nabídky kdykoliv potřebujete",
    ],
  },
  {
    name: "Botiq",
    tagline: "AI poradce na webu i e-shopu + Social Media Manager",
    highlight: "Dva nástroje v jednom",
    description:
      "AI poradce přímo na Vašem webu nebo e-shopu. Odpovídá zákazníkům, doporučuje produkty nebo služby — a navíc rozšiřuje povědomí značky a hledá obchodní příležitosti pro obchodní zástupce.",
    extended: [
      "V první roli: AI poradce. Na e-shopu doporučuje produkty jako prodavač v kamenné prodejně. Na klasickém webu vede návštěvníka službami — vysvětlí, doporučí, sebere kontakt. Výsledek — vyšší konverze, méně opuštěných návštěv.",
      "V druhé roli: Social Media Manager. Automaticky komentuje pod reels Vašich potenciálních zákazníků, zapojuje se do diskuzí a hledá obchodní příležitosti. Nedetekovatelné jako bot — působí jako reálný engagement Vaší značky.",
    ],
    useCases: [
      "Poradce na e-shopu s doporučením produktu",
      "Asistent na webu služeb — vede návštěvníka k poptávce",
      "Komentáře a engagement pod reels Vašich potenciálních klientů",
      "Hledání leadů na Instagramu pro obchodní zástupce",
      "Rozšiřování povědomí značky bez extra hodin práce",
    ],
  },
  {
    name: "Fakturiq",
    tagline: "Automatická fakturace z Messengeru a Instagramu",
    description:
      "Objednávka přijde přes Messenger — faktura se vytvoří automaticky. Zdá se to jako banalita — ale šetří to času víc, než se zdá.",
    extended: [
      "Pro řemeslníky a malé e-shopy, kteří dostávají objednávky přes sociální sítě. Místo přepisování do účetního systému Fakturiq přečte zprávu, vytáhne kontakt a položku, a vystaví fakturu. Klient ji dostane do mailu během minuty.",
    ],
    useCases: [
      "5–10 hodin týdně ušetřených adminem u řemeslníka",
      "Žádné zapomenuté faktury, žádné překlepy v IČO",
      "Přehled v reálném čase — víte kolik Vám dluží kdo a od kdy",
    ],
  },
  {
    name: "Reklamiq",
    tagline: "CRM napojené na Meta Ads",
    description:
      "Lead z reklamy — SMS klientovi i jeho obchodním zástupcům. Okamžitá reakce, žádné ztracené kontakty.",
    extended: [
      "60 sekund po vyplnění lead form na Vaší Meta reklamě dostane potenciální klient SMS s děkovnou zprávou — a Váš obchodní zástupce dostane SMS o novém leadu. Konec scénářů „lead přišel v noci, ozvali jsme se ráno, klient už šel jinam“.",
    ],
    useCases: [
      "Reakce na lead do 60 sekund od vyplnění formuláře",
      "Rovnoměrné rozdělování leadů mezi obchodní zástupce",
      "Měření kvality reklamních kampaní podle skutečně uzavřených dealů",
    ],
  },
  {
    name: "Linkediq",
    tagline: "LinkedIn outreach automatizace",
    description:
      "Automatizovaný outreach na LinkedInu. Nedetekovatelný platformou LinkedIn jako bot.",
    extended: [
      "Pro B2B prodej. Linkediq vyhledá ideální profily podle Vašich kritérií, posílá personalizované žádosti o spojení a follow-up zprávy. Platforma neumí rozeznat od skutečného uživatele — žádný banhammer, žádné ztracené účty.",
    ],
    useCases: [
      "Outreach na 200+ profilů týdně bez ručního klikání",
      "Personalizované zprávy podle role a oboru",
      "Funnel od žádosti o spojení po dohodnutou schůzku",
    ],
  },
  {
    name: "Metaiq",
    tagline: "Automatizace správy sociálních sítí",
    description:
      "Komentování pod reels, zapojování se do diskuz a mnoho dalšího. Nedetekovatelné platformou Meta.",
    extended: [
      "Spravuje sociální sítě tak, jak by je spravoval social media manager s nekonečným časem. Komentuje pod reels v oboru, reaguje na zmínky značky, zapojuje se do diskuzí. Buduje organické povědomí, které algoritmus odměňuje dosahem.",
    ],
    useCases: [
      "Engagement pod reels potenciálních zákazníků",
      "Reakce na zmínky značky v reálném čase",
      "Růst organického dosahu bez placení za reklamu",
    ],
  },
  {
    name: "Bookiq",
    tagline: "Rezervační systém",
    description:
      "Rezervace napojené na Messenger, Instagram, WhatsApp i SMS. Vše na jednom místě.",
    extended: [
      "Pro restaurace, kosmetiky, doktory a každého, kdo žije na rezervacích. Klient si rezervuje přes svůj oblíbený kanál — Bookiq vše zkonsoliduje do jednoho kalendáře, pošle připomínky den před, a po návštěvě poprosí o recenzi.",
    ],
    useCases: [
      "Jeden kalendář pro rezervace ze všech kanálů",
      "Automatické připomínky 24 a 2 hodiny před",
      "Žádost o Google recenzi den po návštěvě",
    ],
  },
  {
    name: "Seoiq",
    tagline: "AI nástroj pro SEO specialisty",
    description:
      "AI engine pro SEO specialisty. Vycvičený naším SEO analytikem na reálných českých kampaních — jeden specialista zvládne práci pěti.",
    extended: [
      "Seoiq není autopilot. Je to mocný asistent, který přebírá rutinní práci SEO specialisty: keyword research, technické audity, monitoring SERPů, návrhy obsahu, sledování konkurence. Specialista pak rozhoduje o strategii a kontroluje výstupy.",
      "Model je vycvičený naším seniorním SEO analytikem na stovkách českých projektů. Nezná jen pravidla Googlu — zná český trh, lokální konkurenci, sezónnost a slovní zásobu, kterou Vaši zákazníci skutečně používají.",
    ],
    useCases: [
      "Hloubkový keyword research za minuty místo dní",
      "Automatické technické audity s prioritizací oprav",
      "Monitoring 1 000+ klíčových slov denně bez zásahu člověka",
      "Návrhy obsahu na základě reálných SERP analýz",
      "Reporting a klientské výstupy připravené automaticky",
    ],
  },
];

const COMING_SOON_HIGHLIGHT = "INVITE ONLY • VEŘEJNÉ OD 1. 6. 2026";

export default function AplikacePage() {
  const [openApp, setOpenApp] = useState<AppDetail | null>(null);

  return (
    <main className="min-h-screen bg-espresso">
      {/* Hero */}
      <section className="px-6 md:px-12 pt-32 pb-20 max-w-7xl mx-auto">
        <RevealOnScroll>
          <DetectiveTag className="mb-6">ZBROJNICE ARBIQ</DetectiveTag>
          <h1 className="font-display font-black text-moonlight text-5xl md:text-7xl leading-[0.9] mb-6">
            Naše aplikace
          </h1>
          <p className="text-sepia/80 max-w-2xl text-lg leading-relaxed">
            <Typewriter text="Nástroje nabroušené pro český trh. Každý řeší konkrétní problém, který potkáváme u každého druhého klienta." />
          </p>
        </RevealOnScroll>
      </section>

      {/* Live Apps */}
      <section className="px-6 md:px-12 pb-16 max-w-7xl mx-auto">
        <StaggerGrid className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {liveApps.map((app) => (
            <div
              key={app.name}
              className="bg-coffee border border-tobacco p-8 hover:border-caramel/40 hover:-translate-y-1 hover:shadow-2xl transition-all duration-300"
            >
              <span className="bg-olive/20 text-olive px-3 py-1 font-mono text-[9px] uppercase tracking-widest">
                {app.highlight}
              </span>
              <h3 className="font-display font-bold text-xl text-moonlight mb-1 mt-4">
                {app.name}
              </h3>
              <p className="text-caramel font-mono text-[11px] uppercase tracking-widest mb-4">
                {app.tagline}
              </p>
              <p className="text-sepia/80 text-sm leading-relaxed mb-6">
                {app.description}
              </p>
              <a
                href={app.url}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-[11px] uppercase tracking-widest text-caramel/70 hover:text-caramel inline-flex items-center gap-2 transition-colors"
              >
                Navštívit <ArrowRight size={12} />
              </a>
            </div>
          ))}
        </StaggerGrid>
      </section>

      {/* Diamond Separator */}
      <div className="max-w-7xl mx-auto px-6 md:px-12 py-8">
        <div className="relative flex items-center justify-center">
          <div className="w-full border-t border-tobacco/30" />
          <div className="absolute bg-espresso px-4">
            <div className="w-3 h-3 border border-caramel/60 rotate-45" />
          </div>
        </div>
      </div>

      {/* Invite-only / detail apps */}
      <section className="px-6 md:px-12 pb-16 max-w-7xl mx-auto">
        <RevealOnScroll>
          <h2 className="font-display font-bold text-2xl text-moonlight mb-8">
            Další nástroje
          </h2>
        </RevealOnScroll>
        <StaggerGrid className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {modalApps.map((app) => (
            <button
              key={app.name}
              type="button"
              onClick={() => setOpenApp({ ...app, highlight: app.highlight ?? COMING_SOON_HIGHLIGHT, comingSoon: !app.highlight })}
              className="text-left bg-coffee border border-tobacco p-8 hover:border-caramel/40 hover:-translate-y-1 hover:shadow-2xl transition-all duration-300 group"
            >
              <span className={`px-3 py-1 font-mono text-[9px] uppercase tracking-widest ${app.highlight ? "bg-olive/20 text-olive" : "bg-rust/20 text-rust"}`}>
                {app.highlight ?? COMING_SOON_HIGHLIGHT}
              </span>
              <h3 className="font-display font-bold text-xl text-moonlight mb-1 mt-4">
                {app.name}
              </h3>
              <p className="text-caramel font-mono text-[11px] uppercase tracking-widest mb-4">
                {app.tagline}
              </p>
              <p className="text-sepia/80 text-sm leading-relaxed mb-6">
                {app.description}
              </p>
              <span className="font-mono text-[11px] uppercase tracking-widest text-caramel/70 group-hover:text-caramel inline-flex items-center gap-2 transition-colors">
                <Eye size={12} /> Detail
              </span>
            </button>
          ))}
        </StaggerGrid>
      </section>

      {/* Bottom note */}
      <section className="px-6 md:px-12 pb-32 max-w-7xl mx-auto">
        <RevealOnScroll>
          <p className="text-sepia/60 font-mono text-sm tracking-wide">
            A mnoho dalšího stále ve vývoji.
          </p>
        </RevealOnScroll>
      </section>

      <AppDetailModal app={openApp} open={openApp !== null} onOpenChange={(o) => !o && setOpenApp(null)} />
    </main>
  );
}
