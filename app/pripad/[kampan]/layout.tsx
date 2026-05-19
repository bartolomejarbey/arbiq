import type { Metadata } from 'next';
import JsonLd from '@/components/seo/JsonLd';
import { kampanData, type KampanKey, validKampane } from '@/lib/kampan-data';
import { breadcrumbSchema, SITE_URL } from '@/lib/seo/structured-data';

export async function generateStaticParams() {
  return validKampane.map((k) => ({ kampan: k }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ kampan: string }>;
}): Promise<Metadata> {
  const { kampan } = await params;
  const cfg = kampanData[kampan as KampanKey];
  if (!cfg) {
    return { title: 'Kampaň', description: 'Detektivní agentura ARBIQ' };
  }
  return {
    title: cfg.headline,
    description: cfg.description,
    alternates: { canonical: `/pripad/${kampan}` },
    openGraph: {
      title: cfg.headline,
      description: cfg.description,
      url: `${SITE_URL}/pripad/${kampan}`,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: cfg.headline,
      description: cfg.description,
    },
  };
}

export default async function Layout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ kampan: string }>;
}) {
  const { kampan } = await params;
  return (
    <>
      <JsonLd
        data={breadcrumbSchema({
          path: `/pripad/${kampan}`,
          items: [
            { name: 'ARBIQ', url: '/' },
            { name: 'Případy', url: '/pripady' },
            { name: kampan, url: `/pripad/${kampan}` },
          ],
        })}
      />
      {children}
    </>
  );
}
