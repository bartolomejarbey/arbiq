import type { Metadata } from 'next';
import JsonLd from '@/components/seo/JsonLd';
import { serviceSchema, breadcrumbSchema, SITE_URL } from '@/lib/seo/structured-data';

export const metadata: Metadata = {
  title: 'Firma — kompletní digitální zázemí',
  description:
    'Web, e-shop, CRM, automatizace, marketing. Vše pod jednou střechou, jeden tým, jeden závazek. Ideální pro malé a střední firmy.',
  alternates: { canonical: '/sluzby/firma' },
  openGraph: {
    title: 'Kompletní digitální zázemí pro firmu',
    description: 'Vše co potřebujete od digitální agentury. Jeden tým, jasné výsledky.',
    url: `${SITE_URL}/sluzby/firma`,
    type: 'website',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <JsonLd
        data={[
          serviceSchema({
            slug: 'firma',
            name: 'Komplexní digitální služby pro firmu',
            description:
              'Web, e-shop, CRM, automatizace, marketing — všechny vrstvy digitálního businessu pro malé a střední firmy.',
            serviceType: 'Digital Business Services',
            priceText: 'Cena na míru po krátké konzultaci',
          }),
          breadcrumbSchema({
            path: '/sluzby/firma',
            items: [
              { name: 'ARBIQ', url: '/' },
              { name: 'Služby', url: '/sluzby/firma' },
              { name: 'Firma', url: '/sluzby/firma' },
            ],
          }),
        ]}
      />
      {children}
    </>
  );
}
