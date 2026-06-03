import type { Metadata } from 'next';
import JsonLd from '@/components/seo/JsonLd';
import { breadcrumbSchema, faqPageSchema, SITE_URL } from '@/lib/seo/structured-data';

export const metadata: Metadata = {
  title: 'Kontakt — pojďme se domluvit',
  description:
    'E-mail info@arbiq.cz, telefon +420 725 932 729. Odpovídáme do 24 hodin. Tři vstupní body: Rentgen (1 500 Kč), 30min schůzka, rychlá zpráva.',
  alternates: { canonical: '/kontakt' },
  openGraph: {
    title: 'Kontakt ARBIQ',
    description: 'info@arbiq.cz, +420 725 932 729. Reakce do 24 h.',
    url: `${SITE_URL}/kontakt`,
    type: 'website',
  },
};

const FAQ = [
  { question: 'Jak dlouho trvá odpověď?', answer: 'Do 24 hodin v pracovních dnech. V naléhavých případech volejte na +420 725 932 729.' },
  { question: 'Kde sídlíte?', answer: 'Oficiální sídlo je Běleč 30, 391 43 Běleč (Bartoloměj Rota, IČO 21875570). Pracujeme remote, schůzky online nebo po domluvě.' },
  { question: 'Co je Rentgen?', answer: 'Vstupní audit webu za 1 500 Kč: hodinová analýza, 30min konzultace, písemný report. Pokud nenalezneme problém, vrátíme peníze. Pokud začnete spolupráci, cena se odečte z první faktury.' },
  { question: 'Vystavujete fakturu s DPH?', answer: 'Ne, ARBIQ (Bartoloměj Rota, IČO 21875570) není plátcem DPH. Ceny jsou konečné.' },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <JsonLd
        data={[
          faqPageSchema({ path: '/kontakt', questions: FAQ }),
          breadcrumbSchema({
            path: '/kontakt',
            items: [
              { name: 'ARBIQ', url: '/' },
              { name: 'Kontakt', url: '/kontakt' },
            ],
          }),
        ]}
      />
      {children}
    </>
  );
}
