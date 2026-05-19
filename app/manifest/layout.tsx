import type { Metadata } from 'next';
import JsonLd from '@/components/seo/JsonLd';
import { breadcrumbSchema, SITE_URL } from '@/lib/seo/structured-data';

export const metadata: Metadata = {
  title: 'Manifest ARBIQ — hodnoty, pravidla, závazky',
  description:
    'Naše desatero. Co děláme, jak to děláme a hlavně co neděláme. Detektivní agentura — hledáme pravdu, ne pohodlí. Klient vlastní svůj web, žádný vendor lock-in.',
  alternates: { canonical: '/manifest' },
  openGraph: {
    title: 'Manifest ARBIQ',
    description: 'Hodnoty, pravidla a závazky detektivní agentury pro digitální business.',
    url: `${SITE_URL}/manifest`,
    type: 'article',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <JsonLd
        data={breadcrumbSchema({
          path: '/manifest',
          items: [
            { name: 'ARBIQ', url: '/' },
            { name: 'Manifest', url: '/manifest' },
          ],
        })}
      />
      {children}
    </>
  );
}
