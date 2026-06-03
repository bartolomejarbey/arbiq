import type { Metadata } from 'next';
import JsonLd from '@/components/seo/JsonLd';
import { breadcrumbSchema, SITE_URL, ORG_ID } from '@/lib/seo/structured-data';

export const metadata: Metadata = {
  title: 'Kariéra — hledáme obchodního zástupce B2B',
  description:
    'B2B prodej celého portfolia ARBIQ (weby, automatizace, AI nástroje, marketing). 30 % cold calls, 30 % hot leads, 40 % Meta Ads poptávky. Fix 30 000 – 50 000 Kč + férové provize + continuelní fee z měsíčních paušálů = pasivní příjem.',
  alternates: { canonical: '/kariera' },
  openGraph: {
    title: 'Kariéra v ARBIQ — obchodní zástupce',
    description:
      'Fix + provize + continuelní fee z paušálů klientů. Plně remote. CRM s automatizovaným ohřevem leadů.',
    url: `${SITE_URL}/kariera`,
    type: 'website',
  },
};

const today = new Date().toISOString().slice(0, 10);
const validThrough = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

const jobPostingSchema = {
  '@context': 'https://schema.org',
  '@type': 'JobPosting',
  '@id': `${SITE_URL}/kariera#job`,
  title: 'Obchodní zástupce B2B (sales representative)',
  description:
    '<p>Hledáme obchodního zástupce pro prodej celého portfolia ARBIQ — weby, automatizace, AI nástroje, marketing.</p>' +
    '<h3>Denní náplň:</h3><ul>' +
    '<li>30 % cold calls — telefonování novým firmám se připraveným skriptem</li>' +
    '<li>30 % hot leads — kvalifikované poptávky ohřáté obsahem a referencemi</li>' +
    '<li>40 % Meta Ads poptávky — kontakty z naší reklamy (Reklamiq pošle SMS do 60 sekund)</li>' +
    '</ul>' +
    '<h3>Odměňování:</h3><ul>' +
    '<li>Fix 30 000 – 50 000 Kč / měsíc dle zkušeností</li>' +
    '<li>Férové provize z prodaných služeb</li>' +
    '<li><strong>Continuelní fee z měsíčních paušálů klientů</strong> — dlouhodobý pasivní příjem</li>' +
    '</ul>',
  identifier: { '@type': 'PropertyValue', name: 'ARBIQ', value: 'arbiq-sales-2026' },
  datePosted: today,
  validThrough,
  employmentType: ['FULL_TIME', 'CONTRACTOR'],
  hiringOrganization: { '@id': ORG_ID },
  jobLocationType: 'TELECOMMUTE',
  applicantLocationRequirements: { '@type': 'Country', name: 'CZ' },
  jobLocation: {
    '@type': 'Place',
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'Běleč 30',
      addressLocality: 'Běleč',
      addressRegion: 'Jihočeský kraj',
      postalCode: '39143',
      addressCountry: 'CZ',
    },
  },
  baseSalary: {
    '@type': 'MonetaryAmount',
    currency: 'CZK',
    value: {
      '@type': 'QuantitativeValue',
      minValue: 30000,
      maxValue: 50000,
      unitText: 'MONTH',
    },
  },
  jobBenefits:
    'Plně remote · CRM s automatizovaným ohřevem leadů · Marketingový support · Continuelní fee z paušálů klientů = pasivní příjem · Cesta k Key Account roli po roce výsledků',
  skills: 'B2B sales, telefonický prodej, CRM, kvalifikace leadů, prezentace, vyjednávání',
  qualifications: 'Min. 1 rok B2B prodeje · Telefonní komunikace bez ostychu · Češtinu na úrovni rodilého mluvčího · Angličtinu na úrovni čtení dokumentace',
  experienceRequirements: '1+ rok B2B prodeje (jiný obor s prokazatelnými výsledky je vítaný)',
  educationRequirements: 'Středoškolské nebo praxe',
  applicationContact: {
    '@type': 'ContactPoint',
    email: 'bartolomej@arbiq.cz',
    contactType: 'HR',
  },
  url: `${SITE_URL}/kariera`,
  directApply: false,
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <JsonLd
        data={[
          jobPostingSchema,
          breadcrumbSchema({
            path: '/kariera',
            items: [
              { name: 'ARBIQ', url: '/' },
              { name: 'Tým', url: '/tym' },
              { name: 'Kariéra', url: '/kariera' },
            ],
          }),
        ]}
      />
      {children}
    </>
  );
}
