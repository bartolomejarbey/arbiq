const BASE = 'https://arbiq.cz';

const ORGANIZATION = {
  '@type': 'Organization',
  '@id': `${BASE}/#organization`,
  name: 'ARBIQ',
  url: BASE,
  logo: `${BASE}/arbiq-logo.png`,
  sameAs: [
    'https://www.linkedin.com/company/arbiq',
  ],
  founder: { '@type': 'Person', name: 'Bartoloměj Rota' },
  address: { '@type': 'PostalAddress', addressCountry: 'CZ' },
};

export function organizationSchema() {
  return { '@context': 'https://schema.org', ...ORGANIZATION };
}

export function serviceSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    '@id': `${BASE}/sluzby/geo-ai-viditelnost#service`,
    name: 'GEO — viditelnost v AI vyhledávačích (ChatGPT, Perplexity, Gemini)',
    serviceType: 'Generative Engine Optimization',
    description:
      'Komplexní optimalizace pro generativní vyhledávače (ChatGPT, Google AI Overviews, Perplexity, Gemini, Claude). Audit, technická infrastruktura pro AI crawlery, restrukturalizace obsahu (answer capsules, schema markup), off-page autorita a měsíční citation monitoring.',
    provider: { '@id': `${BASE}/#organization` },
    areaServed: { '@type': 'Country', name: 'Czech Republic' },
    audience: {
      '@type': 'BusinessAudience',
      audienceType: 'Malé a střední firmy (5–50 zaměstnanců), OSVČ s vyšším ticketem, B2B služby',
    },
    offers: [
      {
        '@type': 'Offer',
        name: 'STOPA',
        description: 'Vstupní balíček pro malé firmy a OSVČ. AI audit (15 dotazů, 3 platformy), technická základna, měsíční report.',
        price: '3500',
        priceCurrency: 'CZK',
        priceSpecification: {
          '@type': 'UnitPriceSpecification',
          price: '3500',
          priceCurrency: 'CZK',
          unitText: 'MONTH',
        },
        eligibleQuantity: { '@type': 'QuantitativeValue', value: 1, unitText: 'MONTH' },
      },
      {
        '@type': 'Offer',
        name: 'VYŠETŘOVÁNÍ',
        description:
          'Hlavní balíček pro SMB firmy a B2B služby. AI audit (30 dotazů, 5 platforem), restrukturalizace top 10 stránek, 1 GEO článek měsíčně, konkurenční benchmark.',
        price: '6000',
        priceCurrency: 'CZK',
        priceSpecification: {
          '@type': 'UnitPriceSpecification',
          price: '6000',
          priceCurrency: 'CZK',
          unitText: 'MONTH',
        },
        eligibleQuantity: { '@type': 'QuantitativeValue', value: 1, unitText: 'MONTH' },
      },
      {
        '@type': 'Offer',
        name: 'VYŘEŠENÝ PŘÍPAD',
        description:
          'Komplexní balíček pro středně velké firmy a regionální leadery. AI audit (50 dotazů, všechny platformy), 2 GEO články měsíčně, Reddit monitoring, listicle outreach, PR pitch.',
        price: '8000',
        priceCurrency: 'CZK',
        priceSpecification: {
          '@type': 'UnitPriceSpecification',
          price: '8000',
          priceCurrency: 'CZK',
          unitText: 'MONTH',
        },
        eligibleQuantity: { '@type': 'QuantitativeValue', value: 1, unitText: 'MONTH' },
      },
    ],
    url: `${BASE}/sluzby/geo-ai-viditelnost`,
  };
}

export type FaqItem = { q: string; a: string };

export function faqSchema(faqs: FaqItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: f.a,
      },
    })),
  };
}

export function breadcrumbSchema(items: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: it.name,
      item: `${BASE}${it.url}`,
    })),
  };
}

export function articleSchema(opts: {
  title: string;
  description: string;
  slug: string;
  datePublished?: string;
  dateModified?: string;
  authorName?: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: opts.title,
    description: opts.description,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${BASE}${opts.slug}`,
    },
    author: {
      '@type': 'Person',
      name: opts.authorName ?? 'Bartoloměj Rota',
      url: `${BASE}/tym`,
    },
    publisher: { '@id': `${BASE}/#organization` },
    datePublished: opts.datePublished,
    dateModified: opts.dateModified ?? opts.datePublished,
    inLanguage: 'cs-CZ',
  };
}

export function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
