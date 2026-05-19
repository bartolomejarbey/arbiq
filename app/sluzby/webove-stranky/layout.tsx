import type { Metadata } from 'next';
import JsonLd from '@/components/seo/JsonLd';
import { serviceSchema, breadcrumbSchema, SITE_URL } from '@/lib/seo/structured-data';

export const metadata: Metadata = {
  title: 'Webové stránky na míru — Next.js + Webiq plugin',
  description:
    'Vícestránkový web na míru, kontaktní formulář, responzivní, mobile-friendly, vlastní Webiq plugin pro úpravy bez programování. Next.js + Vercel. 6 000 – 8 000 Kč.',
  alternates: { canonical: '/sluzby/webove-stranky' },
  openGraph: {
    title: 'Webové stránky na míru — ARBIQ',
    description: 'Next.js, mobile-first, Webiq plugin pro klienta. 6 000 – 8 000 Kč.',
    url: `${SITE_URL}/sluzby/webove-stranky`,
    type: 'website',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <JsonLd
        data={[
          serviceSchema({
            slug: 'webove-stranky',
            name: 'Webové stránky na míru',
            description:
              'Vlastní design (žádné šablony, žádný WordPress drag-and-drop). Postaveno na Next.js, hostováno na Vercelu. Klient si může web upravovat sám přes Webiq plugin.',
            serviceType: 'Web Development',
            priceFrom: 6000,
            priceCurrency: 'CZK',
          }),
          breadcrumbSchema({
            path: '/sluzby/webove-stranky',
            items: [
              { name: 'ARBIQ', url: '/' },
              { name: 'Služby', url: '/sluzby/webove-stranky' },
              { name: 'Webové stránky', url: '/sluzby/webove-stranky' },
            ],
          }),
        ]}
      />
      {children}
    </>
  );
}
