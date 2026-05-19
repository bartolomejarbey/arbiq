import type { Metadata } from 'next';
import JsonLd from '@/components/seo/JsonLd';
import { serviceSchema, breadcrumbSchema, SITE_URL } from '@/lib/seo/structured-data';

export const metadata: Metadata = {
  title: 'Jak získat zákazníky — marketing & lead generation',
  description:
    'Meta Ads, Google Ads, SEO, e-mailing, sociální sítě, lead nurturing. Pomůžeme vám rozjet smysluplný marketing s malým rozpočtem. Specializace na malé firmy.',
  alternates: { canonical: '/sluzby/ziskat-zakazky' },
  openGraph: {
    title: 'Získat zákazníky s ARBIQ',
    description: 'Performance marketing + SEO + content. Cena se formuje po krátké konzultaci.',
    url: `${SITE_URL}/sluzby/ziskat-zakazky`,
    type: 'website',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <JsonLd
        data={[
          serviceSchema({
            slug: 'ziskat-zakazky',
            name: 'Marketing & lead generation',
            description:
              'PPC (Google, Sklik), Meta Ads, e-mailing, sociální sítě. Specializace: malé rozpočty, B2B i B2C.',
            serviceType: 'Digital Marketing',
            priceText: 'Cena dle rozsahu kampaně a měsíčního rozpočtu — po krátké konzultaci',
          }),
          breadcrumbSchema({
            path: '/sluzby/ziskat-zakazky',
            items: [
              { name: 'ARBIQ', url: '/' },
              { name: 'Služby', url: '/sluzby/ziskat-zakazky' },
              { name: 'Získat zákazníky', url: '/sluzby/ziskat-zakazky' },
            ],
          }),
        ]}
      />
      {children}
    </>
  );
}
