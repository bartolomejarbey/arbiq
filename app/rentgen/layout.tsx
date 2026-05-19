import type { Metadata } from 'next';
import JsonLd from '@/components/seo/JsonLd';
import { serviceSchema, breadcrumbSchema, faqPageSchema, SITE_URL } from '@/lib/seo/structured-data';

export const metadata: Metadata = {
  title: 'Rentgen — vstupní audit webu za 1 500 Kč',
  description:
    'Hodinová hloubková analýza Vašeho webu od ARBIQ. 60 min vyšetřování + 30 min konzultace + písemný report do 5 dnů. Nenajdeme problém, vrátíme peníze. Pokud začnete spolupráci, cena se odečte z první faktury.',
  alternates: { canonical: '/rentgen' },
  openGraph: {
    title: 'Rentgen — audit webu za 1 500 Kč',
    description:
      'Najdeme 8 typických problémů (chybějící měření, slabé SEO, pomalost, žádné CTA, GDPR, …). Garance vrácení peněz.',
    url: `${SITE_URL}/rentgen`,
    type: 'website',
  },
};

const FAQ = [
  { question: 'Co když nenajdete žádný problém?', answer: 'Gratulujeme a vrátíme peníze. Náš Rentgen má garanci: pokud na webu nenajdeme žádný reálný problém, plně vrátíme 1 500 Kč.' },
  { question: 'Je to opravdu jen 1 500 Kč?', answer: 'Ano. Chceme abyste viděli, co umíme, dříve než se rozhodnete pro větší spolupráci. Cena je konečná, zhotovitel není plátcem DPH.' },
  { question: 'Co když si pak u Vás něco objednám?', answer: 'Cena Rentgenu (1 500 Kč) se odečte z první faktury za jakoukoli navazující službu.' },
  { question: 'Jak dlouho to trvá?', answer: 'Hodinová hloubková analýza (60 min) + 30minutová konzultace + písemný report do 5 pracovních dnů od objednání.' },
  { question: 'Komu Rentgen pomůže nejvíc?', answer: 'Podnikatelům a firmám které mají web a marketing, ale necítí výsledky. Často odhalíme problém, který je dlouhodobě brzdí.' },
  { question: 'Kdo Rentgen dělá?', answer: 'Bartoloměj Rota osobně, nebo proškolený analytik z týmu ARBIQ. Vždy konkrétní člověk, ne anonymní šablona.' },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <JsonLd
        data={[
          serviceSchema({
            slug: 'rentgen',
            name: 'Rentgen — vstupní audit webu',
            description:
              'Hodinová hloubková analýza webu, 30min konzultace a písemný report do 5 dnů. Garance vrácení peněz pokud nenalezneme problém.',
            serviceType: 'Website Audit',
            priceFrom: 1500,
            priceCurrency: 'CZK',
          }),
          faqPageSchema({ path: '/rentgen', questions: FAQ }),
          breadcrumbSchema({
            path: '/rentgen',
            items: [
              { name: 'ARBIQ', url: '/' },
              { name: 'Rentgen', url: '/rentgen' },
            ],
          }),
        ]}
      />
      {children}
    </>
  );
}
