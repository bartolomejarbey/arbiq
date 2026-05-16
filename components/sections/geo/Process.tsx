import DetectiveTag from '@/components/shared/DetectiveTag';
import { Search, Wrench, FileEdit, Globe2, LineChart } from 'lucide-react';

const steps = [
  {
    icon: Search,
    timeline: 'TÝDEN 1',
    title: 'AI Rentgen audit',
    body:
      'Položíme 30–50 otázek, které pokládají Vaši zákazníci, do ChatGPT, Perplexity, Gemini a Google AI Overviews. Zjistíme přesně, ve kterých Vy nejste, kde je konkurence, a proč. Baseline report dostanete jako podklad pro rozhodnutí.',
  },
  {
    icon: Wrench,
    timeline: 'TÝDEN 2–3',
    title: 'Technická infrastruktura',
    body:
      'Povolení AI crawlerů (GPTBot, PerplexityBot, ClaudeBot, Bingbot, Google-Extended), Bing indexace, schema markup (Organization, Article, FAQ, LocalBusiness, Product), llms.txt, GA4 tracking AI trafficu. Bez tohohle základu Vás AI fyzicky nevidí.',
  },
  {
    icon: FileEdit,
    timeline: 'MĚSÍC 1–2',
    title: 'Restrukturalizace obsahu',
    body:
      'Top 10–20 stránek dostane answer capsules (krátké odpovědi pod nadpisy), question-based H2, statistiky, tabulky a author bios. To je struktura, kterou Princeton studie potvrdila jako klíčovou.',
  },
  {
    icon: Globe2,
    timeline: 'MĚSÍC 2–6',
    title: 'Off-page autorita',
    body:
      'Strategická přítomnost na Redditu, Wikipedii a v listicles. Brand mentions v relevantních médiích. 90 % toho, co AI cituje, není Váš vlastní web — je to, co o Vás píší ostatní.',
  },
  {
    icon: LineChart,
    timeline: 'PRŮBĚŽNĚ',
    title: 'Měsíční monitoring a refresh',
    body:
      '40–60 % citovaných zdrojů v AI odpovědích rotuje měsíčně. Bez kontinuálního refresh ztratíte pozici za jeden až dva měsíce. Měsíční reporty ukazují, kde Vás cituje která AI, ve kterých dotazech vyhráváte, kde je třeba zapracovat.',
  },
];

export default function Process() {
  return (
    <section id="proces" className="py-24 md:py-32 bg-coffee scroll-mt-32 md:scroll-mt-44">
      <div className="max-w-5xl mx-auto px-6 md:px-12">
        <DetectiveTag className="mb-4">VYŠETŘOVACÍ POSTUP</DetectiveTag>
        <h2 className="font-display font-black text-moonlight text-4xl md:text-5xl mb-4">
          Jak to děláme
        </h2>
        <p className="text-sepia/80 text-base leading-relaxed max-w-3xl mb-16">
          Pět kroků. Žádné magie, žádné sliby. Konkrétní práce s konkrétními výstupy.
        </p>

        <div className="space-y-6">
          {steps.map((s, i) => {
            const Icon = s.icon;
            return (
              <div
                key={s.title}
                className="grid grid-cols-[auto_1fr] gap-6 md:gap-10 bg-espresso border border-tobacco p-6 md:p-8 hover:border-caramel/40 transition-colors"
              >
                <div className="flex flex-col items-center gap-3">
                  <span className="font-mono text-xl md:text-2xl font-bold text-caramel/30">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <div className="w-12 h-12 bg-coffee border border-tobacco flex items-center justify-center">
                    <Icon size={20} className="text-caramel" strokeWidth={1.5} />
                  </div>
                </div>
                <div>
                  <div className="flex flex-wrap items-baseline gap-3 mb-3">
                    <h3 className="font-display font-bold text-xl md:text-2xl text-moonlight">
                      {s.title}
                    </h3>
                    <span className="font-mono text-[10px] uppercase tracking-widest text-caramel border border-caramel/30 px-2 py-1">
                      {s.timeline}
                    </span>
                  </div>
                  <p className="text-sepia/85 text-sm md:text-base leading-relaxed">{s.body}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
