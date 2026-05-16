'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import DetectiveTag from '@/components/shared/DetectiveTag';
import type { FaqItem } from '@/lib/schema/geo-page-schemas';

export const faqs: FaqItem[] = [
  {
    q: 'Co je vlastně GEO a jak se liší od SEO?',
    a: 'GEO (Generative Engine Optimization) je optimalizace pro generativní vyhledávače jako ChatGPT, Gemini nebo Perplexity. Zatímco SEO řeší pozici v odkazech na Googlu, GEO řeší, zda Vás AI cituje v odpovědi. 60–80 % metod se překrývá s dobrým SEO (technický základ, kvalitní obsah, autorita). Specifické GEO techniky (answer capsules, AI crawlers, citation tracking, refresh kadence) jsou ale nové.',
  },
  {
    q: 'Kdy uvidím první výsledky?',
    a: 'Konzervativně: technické fixy nasazené do 2–4 týdnů, první citace v AI odpovědích za 4–12 týdnů, stabilní citation share za 3–6 měsíců, měřitelný business impact za 6–12 měsíců. Rychlost závisí na oboru, konkurenci a stavu výchozího webu.',
  },
  {
    q: 'Kolik trafficu dnes AI vyhledávání reálně přináší?',
    a: 'Upřímná odpověď: aktuálně 1–2 % celkového web trafficu v ČR. Konvertuje ale 4–11× lépe než klasické vyhledávání, takže business impact je nepoměrný k objemu. Růst je 500 % ročně — za dva roky odhadujeme 20–30 % trafficu z AI.',
  },
  {
    q: 'Můžu udělat AI viditelnost sám?',
    a: 'Ano, ale je to specifická disciplína. Bez znalosti konkrétních faktorů (AI bot povolení, Bing indexace, answer capsule struktura, schema markup, citation rotation) se týdny ztrácejí experimentováním. Pokud máte čas a chuť, máme pro Vás DIY návod v blogu. Pokud chcete pozici rychle a systematicky, dělá se to lépe ve dvou.',
  },
  {
    q: 'Funguje to pro mou firmu?',
    a: 'Záleží. B2B služby, profesní poradenství, high-ticket produkty — ano, výrazně. Lokální komodity (deratizace, malíři) — pomalejší růst, ale ano. E-shopy — opatrně, AI shopping je teprve v plenkách. V auditu Vám řekneme upřímně, jestli má smysl do GEO investovat, nebo jestli by Vám klasické SEO přineslo víc.',
  },
  {
    q: 'Co když AI vyhledávání nepřežije a vrátíme se ke Googlu?',
    a: 'Pravděpodobnost extrémně nízká. ChatGPT má 800 milionů uživatelů týdně a roste exponenciálně. Google sám nasadil AI Overviews na 25 % dotazů. I kdyby se trend zpomalil na polovinu, je to pořád transformační. Navíc — technické fixy a kvalitní strukturovaný obsah pomáhají i klasickému SEO. Investice neztrácí hodnotu.',
  },
  {
    q: 'Slibujete konkrétní pozici nebo počet leadů?',
    a: 'Ne. Nikdo seriózní to nemůže slíbit. Slibujeme zvýšení citation rate v měřitelných intervalech, GA4 setup pro tracking AI trafficu a transparentní měsíční reporting. Garantujeme práci, ne výsledek, který závisí na desítkách proměnných (obor, konkurence, kvalita Vašeho výchozího obsahu).',
  },
  {
    q: 'Kdo je vaše konkurence v ČR?',
    a: 'V SMB segmentu (3–10 tisíc / měs.) prakticky žádná. Pavel Ungr dělá enterprise GEO za 35k+/měs. Velké agentury (eMan, Acomware) zatím GEO systematicky neřeší. Vy získáváte pozici, dokud se to nezmění — a podle pohybu na trhu je to otázka 12–18 měsíců.',
  },
  {
    q: 'Co se stane po skončení smlouvy?',
    a: 'Technické fixy a vytvořený obsah zůstávají na Vašem webu napořád. Měsíční refresh, content production a monitoring pochopitelně končí — bez nich pozice za 2–4 měsíce začne erodovat (40–60 % citovaných zdrojů v AI rotuje měsíčně). Doporučujeme minimum 6 měsíců, ideálně 12.',
  },
  {
    q: 'Můžu zrušit smlouvu?',
    a: 'Měsíční výpověď bez sankce po prvních třech měsících. První tři měsíce jsou zafixované, protože většina práce (setup, audit, technika, první restrukturalizace) se dělá v nich — a hodnota pro Vás vzniká až jejich společným dokončením.',
  },
  {
    q: 'Pracujete s mým CMS?',
    a: 'WordPress, Webflow, Shopify, Next.js, Hugo, Astro — ano, bez problému. Velmi specifická CMS (Typo3, staré verze Drupalu) — řešíme případ od případu, audit ukáže, co je realisticky proveditelné.',
  },
  {
    q: 'Co je llms.txt a potřebuju ho?',
    a: 'Krátká odpověď: aktuálně ho ChatGPT ani Perplexity oficiálně nečte. Nasazujeme ho proto, že se to může v budoucnu změnit a nasazení trvá 30 minut. Nejde o magickou střelu — je to malá investice s opčním upside.',
  },
  {
    q: 'Říká se, že GEO je jen převlečené SEO. Je to pravda?',
    a: 'Z 60–80 % se metody překrývají s dobrým SEO (technický základ, kvalitní obsah, autorita, schema markup). Specifické GEO věci (answer capsules, AI crawlery, citation tracking, refresh kadence, Reddit/Wikipedia outreach) jsou ale nové a v klasickém SEO se neřešily. Považujte to za rozšíření, ne náhradu.',
  },
  {
    q: 'Co když si moje firma neumí ani SEO?',
    a: 'Tím lépe. Začneme od nuly, technicky správně, a získáte rovnou pozici v AI vyhledávání i v Googlu. Není potřeba předchozí SEO — naopak, často je jednodušší stavět na zelené louce než opravovat 5 let starý kanibalizovaný obsah.',
  },
  {
    q: 'Můžu vidět nějaké výsledky vašich klientů?',
    a: 'Aktuálně sbíráme první case studies — publikujeme od Q3 2026 (toto je nová disciplína, kde 6+ měsíců dat je zlato). Mezitím Vám rádi ukážeme baseline report z auditu, kde sami nyní v AI vyhledávání stojíte. To je transparentní vstup do rozhodnutí — vidíte přesně, co dnes AI o Vašem oboru říká, a kde je Vaše pozice.',
  },
];

export default function FAQ() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section className="py-24 md:py-32 bg-coffee">
      <div className="max-w-3xl mx-auto px-6 md:px-12">
        <DetectiveTag className="mb-4">VÝSLECH</DetectiveTag>
        <h2 className="font-display font-black text-moonlight text-4xl md:text-5xl mb-12">
          Časté otázky
        </h2>
        <div className="space-y-2">
          {faqs.map((faq, i) => {
            const isOpen = open === i;
            return (
              <motion.div
                key={faq.q}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: 0.4, delay: Math.min(i * 0.03, 0.3) }}
                className={`border transition-colors ${
                  isOpen ? 'border-caramel/60 bg-caramel/[0.03]' : 'border-tobacco'
                }`}
              >
                <button
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="w-full flex justify-between items-center p-6 text-left hover:bg-caramel/5 transition-colors"
                  aria-expanded={isOpen}
                >
                  <span className="text-moonlight font-medium pr-4">{faq.q}</span>
                  <motion.div
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.25, ease: 'easeOut' }}
                    className="shrink-0"
                  >
                    <ChevronDown size={18} className="text-caramel" />
                  </motion.div>
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      key="content"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                      className="overflow-hidden"
                    >
                      <div className="px-6 pb-6 text-sepia/80 text-sm leading-relaxed border-t border-tobacco pt-4">
                        {faq.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
