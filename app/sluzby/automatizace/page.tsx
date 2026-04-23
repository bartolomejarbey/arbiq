import Link from "next/link";
import DetectiveTag from "@/components/shared/DetectiveTag";
import MarkerUnderline from "@/components/shared/MarkerUnderline";
import { ArrowRight, CheckCircle } from "lucide-react";

const timelineSteps = [
  "QR kód na lednici v každém bytě",
  "Nájemník naskenuje — otevře se formulář",
  "Vybere typ závady + vyfotí problém",
  "Systém automaticky najde nejbližší relevantní řemeslníky s referencemi",
  "Odešle jim e-mail + SMS s popisem, fotkou, adresou",
  "Řemeslník odpoví \"přijedu ve středu za 3 500 Kč\" — správce potvrdí",
];

export default function AutomatizacePage() {
  return (
    <div className="pt-32">
      {/* HERO */}
      <section className="pb-24 px-6 md:px-12">
        <div className="max-w-7xl mx-auto">
          <div className="max-w-3xl">
            <DetectiveTag className="mb-8">AUTOMATIZACE FIREM</DetectiveTag>
            <h1 className="font-display font-black text-moonlight text-5xl md:text-7xl leading-[0.9] mb-8">
              Nejsme zelenáči s přelepenými <MarkerUnderline>šablonami</MarkerUnderline>.
            </h1>
            <p className="text-lg md:text-xl text-sepia max-w-2xl leading-relaxed">
              Děláme automatizace na míru. Na míru znamená, že to funguje přesně tak, jak Váš provoz potřebuje — ne tak, jak to umí něčí šablona.
            </p>
          </div>
        </div>
      </section>

      {/* DEFINICE */}
      <section className="py-16 bg-coffee">
        <div className="max-w-4xl mx-auto px-6 md:px-12">
          <div className="bg-espresso border border-tobacco p-8 md:p-12">
            <p className="font-mono text-sm md:text-base text-sepia leading-relaxed">
              <span className="text-caramel font-bold">au·to·ma·ti·za·ce na mí·ru</span>{" "}
              <span className="text-sandstone">(podstatné jméno)</span>{" "}
              — Proces, při kterém se opakující se činnost ve firmě nahradí systémem, který byl navržen, postaven a otestován výhradně pro konkrétní provoz konkrétní firmy. Opakem je &bdquo;nalepená šablona, která funguje v demu a padá v reálu.&ldquo;
            </p>
          </div>
        </div>
      </section>

      {/* DVA TYPY FIREM */}
      <section className="py-24 bg-espresso">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <DetectiveTag className="mb-4">DVA TYPY FIREM</DetectiveTag>
          <h2 className="font-display font-black text-moonlight text-4xl md:text-5xl mb-16">
            Která z nich jste Vy?
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Karta A */}
            <div className="bg-coffee border border-tobacco p-8 md:p-10">
              <span className="font-mono text-[10px] uppercase tracking-widest text-caramel block mb-4">TYP A</span>
              <h3 className="font-display font-bold text-2xl text-moonlight mb-6">
                Firma, která žije online
              </h3>
              <ul className="space-y-4">
                {[
                  "Meta Ads → CRM (lead se automaticky zapíše, obchodník dostane notifikaci)",
                  "E-mailing (automatické sekvence podle chování zákazníka)",
                  "CRM a obchodní tým (pipeline, follow-upy, úkoly automaticky)",
                  "Reporting (denní/týdenní report do e-mailu)",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <CheckCircle size={16} className="text-caramel shrink-0 mt-0.5" />
                    <span className="text-sepia/80 text-sm leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Karta B */}
            <div className="bg-coffee border border-tobacco p-8 md:p-10">
              <span className="font-mono text-[10px] uppercase tracking-widest text-caramel block mb-4">TYP B</span>
              <h3 className="font-display font-bold text-2xl text-moonlight mb-6">
                Firma, která pálí čas na komunikaci
              </h3>
              <ul className="space-y-4">
                {[
                  "Příjem požadavků bez telefonu",
                  "Automatické přiřazení k specialistovi",
                  "Notifikace všem zúčastněným",
                  "Sledování stavu řešení",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <CheckCircle size={16} className="text-caramel shrink-0 mt-0.5" />
                    <span className="text-sepia/80 text-sm leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CASE STUDY */}
      <section className="py-24 bg-parchment paper-texture text-espresso-text relative">
        <div className="max-w-5xl mx-auto px-6 md:px-12">
          {/* Razítko */}
          <div className="absolute top-8 right-8 md:right-16 border-4 border-olive px-6 py-3 rotate-12 opacity-60">
            <span className="font-mono text-lg uppercase tracking-widest text-olive font-bold">Vyřešeno</span>
          </div>

          <DetectiveTag variant="light" className="mb-4">VYŘEŠENÝ PŘÍPAD — AUTOMATIZACE</DetectiveTag>
          <h2 className="font-display font-black text-espresso-text text-4xl md:text-5xl mb-6">
            Správa nemovitostí
          </h2>
          <p className="text-brown-muted mb-4">
            Firma pro správu nemovitostí, desítky bytů, stovky nájemníků.
          </p>

          {/* Symptomy */}
          <div className="mt-12 mb-16">
            <h3 className="font-mono text-[11px] uppercase tracking-widest text-brown-muted mb-6">Symptomy</h3>
            <div className="bg-parchment-aged/50 border border-parchment-stain p-8 md:p-10 text-brown-muted leading-relaxed">
              <p>
                Nájemník má závadu. Zavolá správci. Správce si to zapíše. Pak obvolává řemeslníky. Prvních pět nezvedne. Šestý nezvedne. Sedmý dělá elektrikáře ale ne topenáře. Osmý má plno. Devátý potřebuje vědět co se rozbilo. Správce volá zpátky nájemníkovi. Nájemník popisuje 20 minut. Správce to přeříkává řemeslníkovi dalších 10 minut.
              </p>
              <p className="mt-4 font-bold text-espresso-text">
                Celkový čas: 65+ minut na jednu závadu. A správce má 30 bytů a 5 závad denně.
              </p>
            </div>
          </div>

          {/* Vyšetřování — timeline */}
          <div className="mb-16">
            <h3 className="font-mono text-[11px] uppercase tracking-widest text-brown-muted mb-8">Vyšetřování</h3>
            <div className="space-y-6">
              {timelineSteps.map((step, i) => (
                <div key={i} className="flex items-start gap-6">
                  <div className="w-10 h-10 shrink-0 bg-espresso-text/10 flex items-center justify-center">
                    <span className="font-mono text-sm font-bold text-espresso-text">{i + 1}</span>
                  </div>
                  <p className="text-brown-muted pt-2">{step}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Verdikt — velká čísla */}
          <div className="mb-12">
            <h3 className="font-mono text-[11px] uppercase tracking-widest text-brown-muted mb-8">Verdikt</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
              <div className="bg-parchment-aged/80 border border-parchment-stain p-6 text-center">
                <p className="font-mono text-[10px] uppercase tracking-widest text-brown-muted mb-2">Čas na závadu</p>
                <p className="font-display font-black text-2xl text-espresso-text">Z 65 min na 3 min</p>
              </div>
              <div className="bg-parchment-aged/80 border border-parchment-stain p-6 text-center">
                <p className="font-mono text-[10px] uppercase tracking-widest text-brown-muted mb-2">Měsíční úspora</p>
                <p className="font-display font-black text-2xl text-espresso-text">~15 000 Kč</p>
              </div>
              <div className="bg-parchment-aged/80 border border-parchment-stain p-6 text-center">
                <p className="font-mono text-[10px] uppercase tracking-widest text-brown-muted mb-2">Náklady</p>
                <p className="font-display font-black text-2xl text-espresso-text">~10 000 Kč</p>
                <p className="font-mono text-[9px] text-brown-muted/60 mt-1">+ 1–4 000 Kč/měs</p>
              </div>
              <div className="bg-parchment-aged/80 border border-parchment-stain p-6 text-center">
                <p className="font-mono text-[10px] uppercase tracking-widest text-brown-muted mb-2">ROI</p>
                <p className="font-display font-black text-2xl text-olive">Zaplaceno za 1. měsíc</p>
              </div>
            </div>
          </div>

          <p className="text-brown-muted font-serif-alt text-lg border-l-2 border-espresso-text/20 pl-6">
            A co je důležitější než peníze: Váš správce přestane nenávidět svou práci.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-espresso text-center">
        <div className="max-w-3xl mx-auto px-6 md:px-12">
          <h2 className="font-display font-black text-moonlight text-4xl md:text-5xl mb-6">
            Chcete automatizaci na míru?
          </h2>
          <p className="text-sepia/70 mb-10 max-w-lg mx-auto">
            Řekneme Vám, co se dá automatizovat, kolik to bude stát a kolik Vám to ušetří.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/rentgen"
              className="bg-caramel text-espresso px-10 py-5 font-mono text-xs uppercase tracking-widest font-bold hover:bg-caramel-light transition-all shadow-xl inline-flex items-center gap-2 justify-center"
            >
              Chci automatizaci na míru <ArrowRight size={14} />
            </Link>
            <Link
              href="/kontakt"
              className="border border-caramel text-caramel px-10 py-5 font-mono text-xs uppercase tracking-widest hover:bg-caramel/10 transition-all inline-flex items-center gap-2 justify-center"
            >
              Kontaktovat nás
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
