import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import DetectiveTag from '@/components/shared/DetectiveTag';
import MarkerUnderline from '@/components/shared/MarkerUnderline';
import JsonLd from '@/components/seo/JsonLd';
import { SITE_URL, breadcrumbSchema } from '@/lib/seo/structured-data';
import { BLOG_POSTS } from '@/lib/blog/posts';

export const metadata: Metadata = {
  title: 'Blog — GEO, AI viditelnost a digitální marketing',
  description:
    'Články o GEO (viditelnosti v AI vyhledávání), digitálním marketingu, webech a automatizaci. Praktické návody a rozbory pro malé firmy.',
  alternates: { canonical: '/blog' },
  openGraph: {
    title: 'Blog — ARBIQ',
    description: 'GEO, AI viditelnost, marketing a automatizace. Návody a rozbory pro malé firmy.',
    url: `${SITE_URL}/blog`,
    type: 'website',
  },
};

const collectionSchema = {
  '@context': 'https://schema.org',
  '@type': 'CollectionPage',
  '@id': `${SITE_URL}/blog#collection`,
  name: 'Blog ARBIQ',
  url: `${SITE_URL}/blog`,
  inLanguage: 'cs',
  isPartOf: { '@id': `${SITE_URL}/#website` },
  hasPart: BLOG_POSTS.map((p) => ({
    '@type': 'BlogPosting',
    headline: p.title,
    description: p.excerpt,
    url: `${SITE_URL}/blog/${p.slug}`,
  })),
};

export default function BlogIndexPage() {
  return (
    <div className="pt-32">
      <JsonLd data={[collectionSchema, breadcrumbSchema({ path: '/blog', items: [{ name: 'ARBIQ', url: '/' }, { name: 'Blog', url: '/blog' }] })]} />

      <section className="pb-16 px-6 md:px-12">
        <div className="max-w-5xl mx-auto">
          <DetectiveTag className="mb-8">BLOG</DetectiveTag>
          <h1 className="font-display font-black text-moonlight text-5xl md:text-7xl leading-[0.9] mb-6">
            Záznamy z <MarkerUnderline>vyšetřování</MarkerUnderline>.
          </h1>
          <p className="text-lg text-sepia max-w-2xl leading-relaxed">
            GEO a AI viditelnost, marketing, weby a automatizace. Praktické návody a rozbory pro malé firmy.
          </p>
        </div>
      </section>

      <section className="pb-32 px-6 md:px-12">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
          {BLOG_POSTS.map((p) => (
            <Link
              key={p.slug}
              href={`/blog/${p.slug}`}
              className="group bg-coffee border border-tobacco p-8 hover:border-caramel hover:bg-tobacco/30 transition-all duration-300 flex flex-col"
            >
              <span className="font-mono text-[10px] uppercase tracking-widest text-caramel mb-4">{p.tag}</span>
              <h2 className="font-display font-bold text-2xl text-moonlight mb-3 group-hover:text-caramel transition-colors leading-snug">
                {p.title}
              </h2>
              <p className="text-sm text-sepia/80 leading-relaxed mb-6 flex-1">{p.excerpt}</p>
              <span className="font-mono text-xs uppercase tracking-wider text-caramel font-bold inline-flex items-center gap-2 group-hover:gap-3 transition-all">
                Číst <ArrowRight size={14} />
              </span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
