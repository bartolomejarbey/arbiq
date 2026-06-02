import type { Metadata } from 'next';
import JsonLd from '@/components/seo/JsonLd';
import { serviceSchema, breadcrumbSchema, SITE_URL } from '@/lib/seo/structured-data';

export const metadata: Metadata = {
  title: 'Grafika — naše grafická agentura Graphiq.cz',
  description:
    'Grafiku řešíme přes sesterskou grafickou agenturu Graphiq.cz: logo a vizuální identita, sociální sítě, tiskoviny, reklamní kreativa, polepy a outdoor.',
  alternates: { canonical: '/sluzby/grafika' },
  openGraph: {
    title: 'Grafika — Graphiq.cz | ARBIQ',
    description: 'Logo, vizuální identita, sociální sítě, tiskoviny, reklama. Grafická agentura Graphiq.cz.',
    url: `${SITE_URL}/sluzby/grafika`,
    type: 'website',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <JsonLd
        data={[
          serviceSchema({
            slug: 'grafika',
            name: 'Grafika a vizuální identita',
            description:
              'Grafický design na míru — logo a značka, kompletní vizuální identita, grafika pro sociální sítě, tiskoviny, reklamní kreativa, prezentace a web grafika.',
            serviceType: 'Graphic Design',
            priceFrom: 2000,
            priceCurrency: 'CZK',
          }),
          breadcrumbSchema({
            path: '/sluzby/grafika',
            items: [
              { name: 'ARBIQ', url: '/' },
              { name: 'Služby', url: '/sluzby/grafika' },
              { name: 'Grafika', url: '/sluzby/grafika' },
            ],
          }),
        ]}
      />
      {children}
    </>
  );
}
