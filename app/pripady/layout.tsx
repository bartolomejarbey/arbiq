import type { Metadata } from 'next';
import JsonLd from '@/components/seo/JsonLd';
import { breadcrumbSchema, SITE_URL } from '@/lib/seo/structured-data';

export const metadata: Metadata = {
  title: 'Reference a realizované projekty',
  description:
    '50+ realizovaných projektů — wellness, řemeslníci, marketplace, sport, realitní makléři, energetika. 100 % klientů s námi pokračuje. Konkrétní výsledky, konkrétní jména.',
  alternates: { canonical: '/pripady' },
  openGraph: {
    title: 'Reference ARBIQ — 50+ projektů, 100 % retence',
    description:
      'Refresh studio, Greenderatizace, Fachmani, Masi-co food, Aura Homes, XTH, Javůrek-ES, OldSpeed Cars, Likvidace hrabošů — projekty které prošly našima rukama.',
    url: `${SITE_URL}/pripady`,
    type: 'website',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <JsonLd
        data={breadcrumbSchema({
          path: '/pripady',
          items: [
            { name: 'ARBIQ', url: '/' },
            { name: 'Reference', url: '/pripady' },
          ],
        })}
      />
      {children}
    </>
  );
}
