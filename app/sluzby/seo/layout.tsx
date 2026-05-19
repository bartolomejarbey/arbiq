import type { Metadata } from 'next';
import JsonLd from '@/components/seo/JsonLd';
import { serviceSchema, breadcrumbSchema, SITE_URL } from '@/lib/seo/structured-data';

export const metadata: Metadata = {
  title: 'SEO správa — 4 000 – 8 000 Kč / měsíc',
  description:
    'Technická optimalizace, keyword research, obsah, linkbuilding, měsíční reporting. Bez závazku, bez black-hat technik, bez slibů zaručených pozic. První výsledky za 3 – 6 měsíců.',
  alternates: { canonical: '/sluzby/seo' },
  openGraph: {
    title: 'SEO správa — ARBIQ',
    description: 'Měsíční SEO 4 – 8 000 Kč. Bez závazku, white hat, transparentní reporting.',
    url: `${SITE_URL}/sluzby/seo`,
    type: 'website',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <JsonLd
        data={[
          serviceSchema({
            slug: 'seo',
            name: 'SEO — optimalizace pro vyhledávače',
            description:
              'Technická + obsahová optimalizace, keyword research, linkbuilding, měsíční reporting. White hat metody. První výsledky za 3 – 6 měsíců.',
            serviceType: 'Search Engine Optimization',
            priceFrom: 4000,
            priceCurrency: 'CZK',
          }),
          breadcrumbSchema({
            path: '/sluzby/seo',
            items: [
              { name: 'ARBIQ', url: '/' },
              { name: 'Služby', url: '/sluzby/seo' },
              { name: 'SEO', url: '/sluzby/seo' },
            ],
          }),
        ]}
      />
      {children}
    </>
  );
}
