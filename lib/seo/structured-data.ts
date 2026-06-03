/**
 * Centrální zdroj Schema.org JSON-LD struktur pro ARBIQ.
 *
 * Hlavní entity:
 *  - Organization (#organization)            — ARBIQ, provozuje Bartoloměj Rota (FO)
 *  - WebSite     (#website)                  — kořen webu, sitelinks search box
 *  - LocalBusiness / ProfessionalService     — pro Google Local Pack
 *  - Person      (#person/<slug>)            — autor / člen týmu
 *  - Service                                 — jednotlivé služby ARBIQ
 *  - FAQPage, BreadcrumbList                 — page-level rich snippets
 *  - SoftwareApplication                     — naše vlastní aplikace
 *
 * Konvence:
 *   - `@id` URL je vždy https://arbiq.cz/<route>#<entityKind>` (stable global ID)
 *   - JSON-LD vkládáme inline jako `<script type="application/ld+json">`
 *   - JSONLd komponentu importuj z @/components/seo/JsonLd
 */

// SEO/JSON-LD base — oddělené od APP_URL (OAuth/runtime, v devu localhost).
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://arbiq.cz';

export const ORG_ID = `${SITE_URL}/#organization`;
export const WEBSITE_ID = `${SITE_URL}/#website`;
export const LOCALBUSINESS_ID = `${SITE_URL}/#localbusiness`;

type WithContext<T> = T & { '@context': 'https://schema.org' };

const PROVIDER = {
  name: 'ARBIQ',
  legalName: 'Bartoloměj Rota',
  email: 'info@arbiq.cz',
  phone: '+420725932729',
  phoneTel: '+420 725 932 729',
  taxID: '21875570',
  foundingDate: '2024',
  description:
    'Detektivní agentura pro digitální business. Web, audit, nástroje, konzultace. Jeden detektiv, jeden případ, jeden výsledek.',
  street: 'Běleč 30',
  city: 'Běleč',
  district: 'Jihočeský kraj',
  postalCode: '39143',
  country: 'CZ',
  linkedin: 'https://www.linkedin.com/company/arbiq',
} as const;

export const organizationSchema: WithContext<Record<string, unknown>> = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  '@id': ORG_ID,
  name: PROVIDER.name,
  legalName: PROVIDER.legalName,
  url: SITE_URL,
  logo: {
    '@type': 'ImageObject',
    url: `${SITE_URL}/arbiq-logo.png`,
    width: 500,
    height: 500,
  },
  image: `${SITE_URL}/arbiq-logo.png`,
  description: PROVIDER.description,
  email: PROVIDER.email,
  telephone: PROVIDER.phone,
  taxID: PROVIDER.taxID,
  foundingDate: PROVIDER.foundingDate,
  founder: {
    '@type': 'Person',
    '@id': `${SITE_URL}/tym#bartolomej-rota`,
    name: 'Bartoloměj Rota',
  },
  address: {
    '@type': 'PostalAddress',
    streetAddress: PROVIDER.street,
    addressLocality: PROVIDER.city,
    addressRegion: PROVIDER.district,
    postalCode: PROVIDER.postalCode,
    addressCountry: PROVIDER.country,
  },
  contactPoint: [
    {
      '@type': 'ContactPoint',
      telephone: PROVIDER.phone,
      email: PROVIDER.email,
      contactType: 'customer service',
      areaServed: 'CZ',
      availableLanguage: ['Czech', 'English'],
    },
  ],
  sameAs: [PROVIDER.linkedin],
  knowsAbout: [
    'Generative Engine Optimization',
    'Search Engine Optimization',
    'Web Development',
    'Next.js',
    'Marketing Automation',
    'AI Implementation',
    'Business Strategy',
  ],
};

export const websiteSchema: WithContext<Record<string, unknown>> = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  '@id': WEBSITE_ID,
  url: SITE_URL,
  name: 'ARBIQ',
  description: PROVIDER.description,
  inLanguage: 'cs-CZ',
  publisher: { '@id': ORG_ID },
};

export const localBusinessSchema: WithContext<Record<string, unknown>> = {
  '@context': 'https://schema.org',
  '@type': 'ProfessionalService',
  '@id': LOCALBUSINESS_ID,
  name: PROVIDER.name,
  legalName: PROVIDER.legalName,
  image: `${SITE_URL}/arbiq-logo.png`,
  url: SITE_URL,
  telephone: PROVIDER.phone,
  email: PROVIDER.email,
  priceRange: '1500 – 80000 Kč',
  address: {
    '@type': 'PostalAddress',
    streetAddress: PROVIDER.street,
    addressLocality: PROVIDER.city,
    addressRegion: PROVIDER.district,
    postalCode: PROVIDER.postalCode,
    addressCountry: PROVIDER.country,
  },
  areaServed: [
    { '@type': 'Country', name: 'Czech Republic' },
  ],
  openingHoursSpecification: [
    {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      opens: '09:00',
      closes: '18:00',
    },
  ],
  sameAs: [PROVIDER.linkedin],
};

export function personSchema(person: {
  slug: string;
  name: string;
  jobTitle: string;
  email?: string;
  phone?: string;
  image?: string;
  knowsAbout?: string[];
  sameAs?: string[];
}): WithContext<Record<string, unknown>> {
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    '@id': `${SITE_URL}/tym#${person.slug}`,
    name: person.name,
    jobTitle: person.jobTitle,
    image: person.image ? `${SITE_URL}${person.image}` : undefined,
    email: person.email,
    telephone: person.phone,
    worksFor: { '@id': ORG_ID },
    knowsAbout: person.knowsAbout,
    knowsLanguage: ['cs', 'en'],
    address: {
      '@type': 'PostalAddress',
      addressLocality: PROVIDER.city,
      addressCountry: PROVIDER.country,
    },
    sameAs: person.sameAs,
  };
}

export function serviceSchema(svc: {
  slug: string;
  name: string;
  description: string;
  serviceType?: string;
  priceFrom?: number;
  priceCurrency?: string;
  priceText?: string;
}): WithContext<Record<string, unknown>> {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    '@id': `${SITE_URL}/sluzby/${svc.slug}#service`,
    name: svc.name,
    serviceType: svc.serviceType ?? svc.name,
    provider: { '@id': ORG_ID },
    areaServed: { '@type': 'Country', name: 'Czech Republic' },
    audience: {
      '@type': 'BusinessAudience',
      audienceType: 'Malé a střední firmy, OSVČ, B2B služby',
    },
    url: `${SITE_URL}/sluzby/${svc.slug}`,
    description: svc.description,
    offers: svc.priceFrom
      ? {
          '@type': 'Offer',
          priceCurrency: svc.priceCurrency ?? 'CZK',
          price: svc.priceFrom,
          availability: 'https://schema.org/InStock',
        }
      : svc.priceText
        ? {
            '@type': 'Offer',
            priceCurrency: svc.priceCurrency ?? 'CZK',
            priceSpecification: {
              '@type': 'PriceSpecification',
              priceCurrency: svc.priceCurrency ?? 'CZK',
              description: svc.priceText,
            },
          }
        : undefined,
  };
}

export function faqPageSchema(args: {
  path: string;
  questions: Array<{ question: string; answer: string }>;
}): WithContext<Record<string, unknown>> {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    '@id': `${SITE_URL}${args.path}#faq`,
    mainEntity: args.questions.map((q) => ({
      '@type': 'Question',
      name: q.question,
      acceptedAnswer: { '@type': 'Answer', text: q.answer },
    })),
  };
}

export function breadcrumbSchema(args: {
  path: string;
  items: Array<{ name: string; url: string }>;
}): WithContext<Record<string, unknown>> {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    '@id': `${SITE_URL}${args.path}#breadcrumbs`,
    itemListElement: args.items.map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: it.name,
      item: it.url.startsWith('http') ? it.url : `${SITE_URL}${it.url}`,
    })),
  };
}

export function softwareApplicationSchema(app: {
  slug: string;
  name: string;
  description: string;
  category?: string;
  url?: string;
  priceText?: string;
  status?: 'live' | 'invite_only' | 'coming_soon';
}): WithContext<Record<string, unknown>> {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    '@id': `${SITE_URL}/aplikace#${app.slug}`,
    name: app.name,
    description: app.description,
    applicationCategory: app.category ?? 'BusinessApplication',
    operatingSystem: 'Web',
    url: app.url ?? `${SITE_URL}/aplikace`,
    provider: { '@id': ORG_ID },
    offers: app.priceText
      ? {
          '@type': 'Offer',
          priceCurrency: 'CZK',
          priceSpecification: {
            '@type': 'PriceSpecification',
            priceCurrency: 'CZK',
            description: app.priceText,
          },
        }
      : undefined,
  };
}

export function articleSchema(article: {
  path: string;
  title: string;
  description: string;
  datePublished: string;
  dateModified?: string;
  image?: string;
  authorSlug?: string;
}): WithContext<Record<string, unknown>> {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    '@id': `${SITE_URL}${article.path}#article`,
    headline: article.title,
    description: article.description,
    image: article.image ? `${SITE_URL}${article.image}` : `${SITE_URL}/arbiq-logo.png`,
    datePublished: article.datePublished,
    dateModified: article.dateModified ?? article.datePublished,
    inLanguage: 'cs-CZ',
    author: article.authorSlug
      ? { '@id': `${SITE_URL}/tym#${article.authorSlug}` }
      : { '@id': ORG_ID },
    publisher: { '@id': ORG_ID },
    mainEntityOfPage: { '@type': 'WebPage', '@id': `${SITE_URL}${article.path}` },
  };
}
