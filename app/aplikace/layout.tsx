import type { Metadata } from 'next';
import JsonLd from '@/components/seo/JsonLd';
import { softwareApplicationSchema, breadcrumbSchema, SITE_URL } from '@/lib/seo/structured-data';

export const metadata: Metadata = {
  title: 'Aplikace ARBIQ — vlastní SaaS nástroje',
  description:
    'Pamatiq (reminders přes Messenger/Instagram), Finatiq (CRM pro finanční poradce), Webiq, Botiq, Fakturiq, Reklamiq, Linkediq, Metaiq, Bookiq, Seoiq. 2 live, 8 invite-only, veřejné spuštění 1. 6. 2026.',
  alternates: { canonical: '/aplikace' },
  openGraph: {
    title: 'Aplikace ARBIQ — 10 vlastních produktů',
    description: '2 live (Pamatiq, Finatiq) + 8 invite-only. Český trh, na míru.',
    url: `${SITE_URL}/aplikace`,
    type: 'website',
  },
};

const APPS = [
  { slug: 'pamatiq', name: 'Pamatiq', description: 'Připomínkovač do Messengeru a Instagramu. První svého druhu v ČR. Připomínky schůzek, plateb, termínů.', category: 'BusinessApplication', priceText: 'od 1 900 Kč / měsíc' },
  { slug: 'finatiq', name: 'Finatiq', description: 'CRM a klientská zóna pro finanční poradce. První open-source v oboru. AI skenování dokumentů, detekce příležitostí.', category: 'BusinessApplication', priceText: 'na míru' },
  { slug: 'webiq', name: 'Webiq', description: 'Vizuální editor pro kódové weby. Next.js zůstává kódový, klient mění texty jako ve Squarespace.', category: 'DeveloperApplication', priceText: 'invite only' },
  { slug: 'botiq', name: 'Botiq', description: 'AI poradce na webu/e-shopu + správce sociálních sítí. Kvalifikuje leady automaticky.', category: 'BusinessApplication', priceText: 'invite only' },
  { slug: 'fakturiq', name: 'Fakturiq', description: 'Auto-fakturace z Messengeru / Instagramu. 5–10 h/týden úspory.', category: 'FinanceApplication', priceText: 'invite only' },
  { slug: 'reklamiq', name: 'Reklamiq', description: 'CRM napojené na Meta Ads. Lead → SMS za 60 sekund.', category: 'BusinessApplication', priceText: 'od 2 400 Kč / měsíc' },
  { slug: 'linkediq', name: 'Linkediq', description: 'LinkedIn outreach automatizace. 200+ profilů týdně, nedetekovatelné.', category: 'BusinessApplication', priceText: 'invite only' },
  { slug: 'metaiq', name: 'Metaiq', description: 'Automatizace správy sociálních sítí. Komentáře, diskuze, engagement.', category: 'BusinessApplication', priceText: 'invite only' },
  { slug: 'bookiq', name: 'Bookiq', description: 'Rezervační systém přes Messenger/WhatsApp/Instagram/SMS v jednom kalendáři.', category: 'BusinessApplication', priceText: 'invite only' },
  { slug: 'seoiq', name: 'Seoiq', description: 'AI engine pro SEO specialisty, vycvičený na českých kampaních.', category: 'DeveloperApplication', priceText: 'invite only' },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <JsonLd
        data={[
          ...APPS.map((a) => softwareApplicationSchema(a)),
          breadcrumbSchema({
            path: '/aplikace',
            items: [
              { name: 'ARBIQ', url: '/' },
              { name: 'Aplikace', url: '/aplikace' },
            ],
          }),
        ]}
      />
      {children}
    </>
  );
}
