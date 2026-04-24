import type { MetadataRoute } from 'next';

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
];

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
    { url: `${BASE}/kontakt`,         priority: 0.8, changeFrequency: 'yearly',  lastModified: now },
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
    { url: `${BASE}/gdpr`,                priority: 0.3, changeFrequency: 'yearly', lastModified: now },
    { url: `${BASE}/obchodni-podminky`,   priority: 0.3, changeFrequency: 'yearly', lastModified: now },
    { url: `${BASE}/podminky-uzivani`,    priority: 0.3, changeFrequency: 'yearly', lastModified: now },
  ];
}
