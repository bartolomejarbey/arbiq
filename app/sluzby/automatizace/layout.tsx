import type { Metadata } from 'next';
import JsonLd from '@/components/seo/JsonLd';
import { serviceSchema, breadcrumbSchema, SITE_URL } from '@/lib/seo/structured-data';

export const metadata: Metadata = {
  title: 'Automatizace firem — ušetřete 15 000 Kč / měsíc',
  description:
    'Meta Ads → CRM → SMS klientovi za 60 sekund (Typ A). Příjem požadavků, auto-přiřazení, notifikace (Typ B). Setup od 10 000 Kč, paušál 1 000 – 4 000 Kč / měsíc. ROI typicky za první měsíc.',
  alternates: { canonical: '/sluzby/automatizace' },
  openGraph: {
    title: 'Automatizace s ARBIQ',
    description: 'Tři minuty místo 65. SMS klientovi za 60 sekund. ROI za první měsíc.',
    url: `${SITE_URL}/sluzby/automatizace`,
    type: 'website',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <JsonLd
        data={[
          serviceSchema({
            slug: 'automatizace',
            name: 'Automatizace firemních procesů',
            description:
              'Lead → CRM → SMS workflow (Typ A) a offline komunikace (Typ B). Příklad správa nemovitostí: nájemník QR → fotka závady → úkol kolegovi. Reakce 3 min místo 65 min.',
            serviceType: 'Business Process Automation',
            priceFrom: 10000,
            priceCurrency: 'CZK',
          }),
          breadcrumbSchema({
            path: '/sluzby/automatizace',
            items: [
              { name: 'ARBIQ', url: '/' },
              { name: 'Služby', url: '/sluzby/automatizace' },
              { name: 'Automatizace', url: '/sluzby/automatizace' },
            ],
          }),
        ]}
      />
      {children}
    </>
  );
}
