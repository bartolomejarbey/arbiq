import Link from 'next/link';
import DetectiveTag from '@/components/shared/DetectiveTag';
import { Check, ArrowRight } from 'lucide-react';

type Tier = {
  name: string;
  setup: string;
  monthly: string;
  description: string;
  features: string[];
  forWhom: string;
  highlight?: boolean;
  badge?: string;
};

const tiers: Tier[] = [
  {
    name: 'STOPA',
    setup: '7 000 Kč',
    monthly: '3 500 Kč',
    description:
      'Pro malé firmy a OSVČ, kteří chtějí začít s AI viditelností bez velké investice.',
    features: [
      'AI Rentgen audit (15 dotazů, 3 AI platformy)',
      'Technická základna (robots.txt, AI crawlery, Bing setup)',
      'Schema markup pro hlavní stránky',
      'GA4 tracking AI trafficu',
      'Měsíční report (PDF)',
      'Refresh 1 stránky měsíčně',
      'E-mailová podpora',
    ],
    forWhom: 'OSVČ, malé služby, malí poradci',
  },
  {
    name: 'VYŠETŘOVÁNÍ',
    setup: '10 000 Kč',
    monthly: '6 000 Kč',
    description:
      'Pro firmy, které berou AI vyhledávání vážně a chtějí systematicky budovat pozici.',
    features: [
      'Vše co STOPA, plus:',
      'AI Rentgen audit (30 dotazů, 5 AI platforem)',
      'Schema markup na celém webu',
      'Restrukturalizace top 10 stránek (answer capsules, FAQ)',
      '1 GEO-optimalizovaný článek měsíčně',
      'Konkurenční benchmark',
      'Měsíční video call (30 min)',
      'Refresh 3 stránek měsíčně',
    ],
    forWhom: 'SMB firmy, profesní služby, B2B',
    highlight: true,
    badge: 'Nejčastější volba',
  },
  {
    name: 'VYŘEŠENÝ PŘÍPAD',
    setup: '15 000 Kč',
    monthly: '8 000 Kč',
    description:
      'Pro firmy, které chtějí dominovat v AI vyhledávání ve svém oboru.',
    features: [
      'Vše co VYŠETŘOVÁNÍ, plus:',
      'AI Rentgen audit (50 dotazů, všechny platformy)',
      '2 GEO-optimalizované články měsíčně',
      'Reddit monitoring + strategická účast',
      'Listicle outreach (placement v „best of“ článcích)',
      'PR pitch do oborových médií (1× kvartálně)',
      'Týdenní citation monitoring s alerty',
      'Prioritní podpora',
    ],
    forWhom: 'Středně velké firmy, regionální leadeři, vyšší ticket B2B',
  },
];

export default function Pricing() {
  return (
    <section className="py-24 md:py-32 bg-espresso">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <DetectiveTag className="mb-4">CENÍK</DetectiveTag>
        <h2 className="font-display font-black text-moonlight text-4xl md:text-5xl mb-4">
          Tři balíčky podle hloubky vyšetřování
        </h2>
        <p className="text-sepia/80 text-base leading-relaxed max-w-3xl mb-16">
          Žádné skryté poplatky, žádné dlouhodobé závazky. Měsíční výpověď po prvních třech měsících.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {tiers.map((tier) => (
            <div
              key={tier.name}
              className={`relative flex flex-col p-8 md:p-10 transition-all ${
                tier.highlight
                  ? 'bg-coffee border-2 border-caramel shadow-2xl lg:-translate-y-4'
                  : 'bg-coffee border border-tobacco'
              }`}
            >
              {tier.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-caramel text-espresso px-4 py-1 font-mono text-[10px] uppercase tracking-widest font-bold">
                  {tier.badge}
                </div>
              )}

              <div className="font-mono text-[10px] uppercase tracking-widest text-caramel mb-3">
                BALÍČEK
              </div>
              <h3 className="font-display font-black text-3xl text-moonlight mb-4">{tier.name}</h3>
              <p className="text-sepia/80 text-sm leading-relaxed mb-8 min-h-[3.5rem]">
                {tier.description}
              </p>

              <div className="mb-8 pb-8 border-b border-tobacco">
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="font-display font-black text-4xl text-caramel">{tier.monthly}</span>
                  <span className="font-mono text-[11px] uppercase tracking-widest text-sandstone">
                    / měsíc
                  </span>
                </div>
                <p className="font-mono text-[11px] uppercase tracking-widest text-sandstone">
                  + jednorázový setup {tier.setup}
                </p>
              </div>

              <ul className="space-y-3 mb-8 flex-1">
                {tier.features.map((f) => (
                  <li key={f} className="flex items-start gap-3">
                    <Check size={14} className="text-caramel shrink-0 mt-1" strokeWidth={2.5} />
                    <span className="text-sepia/85 text-sm leading-relaxed">{f}</span>
                  </li>
                ))}
              </ul>

              <div className="mb-6 pb-6 border-t border-tobacco pt-6">
                <p className="font-mono text-[10px] uppercase tracking-widest text-sandstone mb-2">
                  Pro koho
                </p>
                <p className="text-sepia/80 text-sm">{tier.forWhom}</p>
              </div>

              <Link
                href={`/kontakt?balicek=${tier.name.toLowerCase().replace(/\s/g, '-')}`}
                className={`inline-flex items-center justify-center gap-2 px-6 py-4 font-mono text-xs uppercase tracking-widest font-bold transition-all w-full ${
                  tier.highlight
                    ? 'bg-caramel text-espresso hover:bg-caramel-light shadow-xl'
                    : 'border border-caramel text-caramel hover:bg-caramel/10'
                }`}
              >
                Vybrat {tier.name} <ArrowRight size={14} />
              </Link>
            </div>
          ))}
        </div>

        {/* Spodek — odkaz na Rentgen */}
        <div className="mt-16 max-w-3xl mx-auto text-center">
          <p className="text-sepia/85 leading-relaxed mb-4">
            Nevíte, který tier je pro Vás? Začněte{' '}
            <Link href="/rentgen" className="text-caramel hover:text-caramel-light underline-offset-4 hover:underline transition-colors">
              AI Rentgenem za 2 500 Kč
            </Link>{' '}
            — jednorázová analýza, kde dnes v AI vyhledávání stojíte. Po něm doporučíme optimální balíček.
          </p>
        </div>
      </div>
    </section>
  );
}
