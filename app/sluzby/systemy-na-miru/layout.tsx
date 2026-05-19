import type { Metadata } from 'next';
import JsonLd from '@/components/seo/JsonLd';
import { serviceSchema, breadcrumbSchema, SITE_URL } from '@/lib/seo/structured-data';

export const metadata: Metadata = {
  title: 'Systémy na míru — Next.js + Supabase + Vercel',
  description:
    'Webové aplikace, SaaS produkty, CRM, rezervační systémy, klientské zóny, API integrace. Plná kontrola nad kódem, žádný vendor lock-in. Příklad: Finatiq, Pamatiq.',
  alternates: { canonical: '/sluzby/systemy-na-miru' },
  openGraph: {
    title: 'Systémy na míru — ARBIQ',
    description: 'Webové aplikace, SaaS, CRM, integrace. Cena se formuje po 30min konzultaci.',
    url: `${SITE_URL}/sluzby/systemy-na-miru`,
    type: 'website',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <JsonLd
        data={[
          serviceSchema({
            slug: 'systemy-na-miru',
            name: 'Systémy na míru',
            description:
              'Webové aplikace (Next.js + Tailwind), SaaS produkty (multi-tenant), CRM s integracemi (Messenger, Instagram, SMS, e-mail), rezervační systémy, klientské zóny / dashboardy, API integrace.',
            serviceType: 'Custom Software Development',
            priceText: 'Cena dle rozsahu po 30min konzultaci',
          }),
          breadcrumbSchema({
            path: '/sluzby/systemy-na-miru',
            items: [
              { name: 'ARBIQ', url: '/' },
              { name: 'Služby', url: '/sluzby/systemy-na-miru' },
              { name: 'Systémy na míru', url: '/sluzby/systemy-na-miru' },
            ],
          }),
        ]}
      />
      {children}
    </>
  );
}
