import type { MetadataRoute } from 'next';
import { BLOG_POSTS as POSTS } from '@/lib/blog/posts';

const BASE = 'https://arbiq.cz';

const KAMPANE = [
  'webove-stranky',
  'marketing',
  'rentgen',
  'edukace',
  'remeslnici',
  'financni-poradci',
  'realitni-makleri',
  'automatizace',
  'startup',
];

const SLUZBY = [
  'webove-stranky',
  'ziskat-zakazky',
  'firma',
  'systemy-na-miru',
  'automatizace',
  'seo',
  'geo-ai-viditelnost',
  'grafika',
];

const BLOG_POSTS = POSTS.map((p) => p.slug);

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: `${BASE}/`,                priority: 1.0, changeFrequency: 'monthly', lastModified: now },
    { url: `${BASE}/vizitka`,         priority: 0.9, changeFrequency: 'yearly',  lastModified: now },
    { url: `${BASE}/rentgen`,         priority: 0.9, changeFrequency: 'monthly', lastModified: now },
    { url: `${BASE}/pripady`,         priority: 0.8, changeFrequency: 'monthly', lastModified: now },
    { url: `${BASE}/aplikace`,        priority: 0.8, changeFrequency: 'monthly', lastModified: now },
    { url: `${BASE}/manifest`,        priority: 0.7, changeFrequency: 'yearly',  lastModified: now },
    { url: `${BASE}/tym`,             priority: 0.7, changeFrequency: 'monthly', lastModified: now },
    { url: `${BASE}/kariera`,         priority: 0.75, changeFrequency: 'weekly', lastModified: now },
    { url: `${BASE}/kontakt`,         priority: 0.8, changeFrequency: 'yearly',  lastModified: now },
    { url: `${BASE}/specializace`,    priority: 0.7, changeFrequency: 'monthly', lastModified: now },
    { url: `${BASE}/blog`,            priority: 0.7, changeFrequency: 'weekly',  lastModified: now },
    ...SLUZBY.map((s) => ({
      url: `${BASE}/sluzby/${s}`,
      priority: 0.8,
      changeFrequency: 'monthly' as const,
      lastModified: now,
    })),
    ...KAMPANE.map((k) => ({
      url: `${BASE}/pripad/${k}`,
      priority: 0.7,
      changeFrequency: 'monthly' as const,
      lastModified: now,
    })),
    ...BLOG_POSTS.map((slug) => ({
      url: `${BASE}/blog/${slug}`,
      priority: 0.7,
      changeFrequency: 'weekly' as const,
      lastModified: now,
    })),
    { url: `${BASE}/gdpr`,                priority: 0.3, changeFrequency: 'yearly', lastModified: now },
    { url: `${BASE}/obchodni-podminky`,   priority: 0.3, changeFrequency: 'yearly', lastModified: now },
    { url: `${BASE}/podminky-uzivani`,    priority: 0.3, changeFrequency: 'yearly', lastModified: now },
  ];
}
