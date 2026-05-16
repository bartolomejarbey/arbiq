import type { Metadata } from 'next';
import Hero from '@/components/sections/geo/Hero';
import WhatIsGeo from '@/components/sections/geo/WhatIsGeo';
import WhyNow from '@/components/sections/geo/WhyNow';
import PrincetonProof from '@/components/sections/geo/PrincetonProof';
import Democratization from '@/components/sections/geo/Democratization';
import Process from '@/components/sections/geo/Process';
import Pricing from '@/components/sections/geo/Pricing';
import FAQ, { faqs } from '@/components/sections/geo/FAQ';
import BlogPreview from '@/components/sections/geo/BlogPreview';
import FinalCTA from '@/components/sections/geo/FinalCTA';
import {
  organizationSchema,
  serviceSchema,
  faqSchema,
  breadcrumbSchema,
  JsonLd,
} from '@/lib/schema/geo-page-schemas';

const TITLE = 'GEO — viditelnost v AI vyhledávačích (ChatGPT, Perplexity, Gemini)';
const DESCRIPTION =
  'Komplexní GEO optimalizace pro české malé a střední firmy. Dostaneme Vás do odpovědí ChatGPT, Google AI Overviews, Perplexity, Gemini a Claude. AI Rentgen audit zdarma, transparentní balíčky od 3 500 Kč/měs.';

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: '/sluzby/geo-ai-viditelnost' },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: '/sluzby/geo-ai-viditelnost',
    type: 'website',
    locale: 'cs_CZ',
  },
  twitter: {
    card: 'summary_large_image',
    title: TITLE,
    description: DESCRIPTION,
  },
  keywords: [
    'GEO',
    'Generative Engine Optimization',
    'AI viditelnost',
    'ChatGPT SEO',
    'Perplexity optimalizace',
    'Gemini SEO',
    'AI vyhledávače',
    'optimalizace pro umělou inteligenci',
    'AI marketing',
  ],
};

export default function GeoAIVisibilityPage() {
  return (
    <div className="pt-32">
      <JsonLd data={organizationSchema()} />
      <JsonLd data={serviceSchema()} />
      <JsonLd data={faqSchema(faqs)} />
      <JsonLd
        data={breadcrumbSchema([
          { name: 'Domů', url: '/' },
          { name: 'Služby', url: '/sluzby/webove-stranky' },
          { name: 'GEO — AI viditelnost', url: '/sluzby/geo-ai-viditelnost' },
        ])}
      />

      <Hero />
      <WhatIsGeo />
      <WhyNow />
      <PrincetonProof />
      <Democratization />
      <Process />
      <Pricing />
      <FAQ />
      <BlogPreview />
      <FinalCTA />
    </div>
  );
}
