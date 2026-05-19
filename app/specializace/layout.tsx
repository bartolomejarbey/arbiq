import type { Metadata } from 'next';
import JsonLd from '@/components/seo/JsonLd';
import { breadcrumbSchema, SITE_URL } from '@/lib/seo/structured-data';

export const metadata: Metadata = {
  title: 'Specializace ARBIQ — pro koho děláme',
  description:
    'Specializujeme se na malé a střední firmy, řemeslníky, finanční poradce, realitní makléře a startupy. Pochopíme váš obor dřív, než začneme stavět.',
  alternates: { canonical: '/specializace' },
  openGraph: {
    title: 'Specializace ARBIQ',
    description: 'Pro koho ARBIQ pracuje a co umíme nejlíp.',
    url: `${SITE_URL}/specializace`,
    type: 'website',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <JsonLd
        data={breadcrumbSchema({
          path: '/specializace',
          items: [
            { name: 'ARBIQ', url: '/' },
            { name: 'Specializace', url: '/specializace' },
          ],
        })}
      />
      {children}
    </>
  );
}
