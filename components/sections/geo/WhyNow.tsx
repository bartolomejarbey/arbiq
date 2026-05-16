import DetectiveTag from '@/components/shared/DetectiveTag';
import RevealOnScroll from '@/components/shared/RevealOnScroll';
import StaggerGrid from '@/components/shared/StaggerGrid';
import { TrendingUp, Target, Users } from 'lucide-react';

const facts = [
  {
    icon: TrendingUp,
    number: '+527 %',
    title: 'AI traffic exploduje',
    body:
      'Meziroční růst návštěvnosti z AI vyhledávačů. Dnes 1–2 % web trafficu v ČR, za dva roky 20–30 %. Semrush oficiálně predikuje, že LLM vyhledávání překoná Google do konce roku 2027.',
    source: 'Semrush LLM Traffic Report 2025',
  },
  {
    icon: Target,
    number: '4–11×',
    title: 'Konvertuje násobně lépe',
    body:
      'Návštěvník z ChatGPT si už přečetl doporučení, ví, co chce, a klikne připravený nakoupit. Studie Microsoft Clarity na 1 200 webech naměřila 11× vyšší konverzi než z klasického vyhledávání.',
    source: 'Microsoft Clarity, 2025',
  },
  {
    icon: Users,
    number: '800M',
    title: 'Vaši zákazníci tam už jsou',
    body:
      '800 milionů lidí používá ChatGPT každý týden. Vaši zákazníci ve věku 25–45 let už hledají hlavně tam. Generace nad 50 přijde za dva roky.',
    source: 'OpenAI, listopad 2025',
  },
];

const timeline = [
  {
    label: 'ROK 1',
    text:
      'Konkurence, která teď začíná, získává citation share v AI odpovědích. Vy stagnujete na úrovni „neexistuji&ldquo;.',
  },
  {
    label: 'ROK 2',
    text:
      'AI vyhledávání zabírá 15–20 % celkového trafficu. Vy v něm pořád nejste. První zákazníci si Vás nevyberou — protože Vás AI nezmínila.',
  },
  {
    label: 'ROK 3',
    text:
      'Pozdě. Citation moat konkurentů je už neprolomitelný. Budete platit 5× víc za stejnou pozici — pokud ji vůbec půjde získat.',
  },
];

export default function WhyNow() {
  return (
    <section id="urgence" className="py-20 md:py-32 bg-espresso scroll-mt-32 md:scroll-mt-44">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <RevealOnScroll>
          <DetectiveTag className="mb-4">URGENCE — PROČ TEĎ</DetectiveTag>
          <h2 className="font-display font-black text-moonlight text-3xl md:text-5xl mb-4 leading-tight">
            12–24 měsíční okno. Pak se zavírá.
          </h2>
          <p className="text-sepia/80 text-base leading-relaxed max-w-3xl mb-16">
            Tři fakta, která mění pohled na AI vyhledávání. Žádné předpovědi — jen čísla, která už dnes platí.
          </p>
        </RevealOnScroll>

        {/* Tři data karty */}
        <StaggerGrid
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-20 md:mb-24"
          staggerDelay={0.12}
        >
          {facts.map((f) => {
            const Icon = f.icon;
            return (
              <div key={f.title} className="bg-coffee border border-tobacco p-6 md:p-8 flex flex-col hover:border-caramel/40 transition-colors">
                <Icon size={32} className="text-caramel mb-6" strokeWidth={1.5} />
                <div className="font-display font-black text-4xl md:text-5xl text-caramel mb-2">{f.number}</div>
                <h3 className="font-display font-bold text-xl text-moonlight mb-4">{f.title}</h3>
                <p className="text-sepia/80 text-sm leading-relaxed mb-6 flex-1">{f.body}</p>
                <p className="font-mono text-[10px] uppercase tracking-widest text-sandstone border-t border-tobacco pt-4">
                  Zdroj: {f.source}
                </p>
              </div>
            );
          })}
        </StaggerGrid>

        {/* Co se stane, když nic neuděláte */}
        <div className="max-w-4xl">
          <RevealOnScroll>
            <DetectiveTag className="mb-4">SCÉNÁŘ NEČINNOSTI</DetectiveTag>
            <h3 className="font-display font-bold text-2xl md:text-3xl text-moonlight mb-10">
              Co se stane, když nic neuděláte
            </h3>
          </RevealOnScroll>

          <StaggerGrid className="space-y-4" staggerDelay={0.15}>
            {timeline.map((t) => (
              <div
                key={t.label}
                className="flex flex-col sm:flex-row items-start gap-3 sm:gap-6 bg-coffee border-l-2 border-rust p-5 md:p-6"
              >
                <span className="font-mono text-xs uppercase tracking-widest text-rust font-bold shrink-0 sm:w-16">
                  {t.label}
                </span>
                <p
                  className="text-sepia/85 text-sm md:text-base leading-relaxed"
                  // eslint-disable-next-line react/no-danger
                  dangerouslySetInnerHTML={{ __html: t.text }}
                />
              </div>
            ))}
          </StaggerGrid>
        </div>
      </div>
    </section>
  );
}
