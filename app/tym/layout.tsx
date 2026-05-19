import type { Metadata } from 'next';
import JsonLd from '@/components/seo/JsonLd';
import { personSchema, breadcrumbSchema, SITE_URL } from '@/lib/seo/structured-data';

export const metadata: Metadata = {
  title: 'Tým ARBIQ — kdo za projekty stojí',
  description:
    'Bartoloměj Rota (zakladatel, vývojář), Matýáš Petr (kamera, střih), Václav Plachejda (automatizace), Fidelio Seidl (Key Account Manager). Jeden tým, čtyři specializace, žádná call centra.',
  alternates: { canonical: '/tym' },
  openGraph: {
    title: 'Tým ARBIQ',
    description: '4 lidé. 4 specializace. Konkrétní jména místo anonymních agentur.',
    url: `${SITE_URL}/tym`,
    type: 'profile',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <JsonLd
        data={[
          personSchema({
            slug: 'bartolomej-rota',
            name: 'Bartoloměj Rota',
            jobTitle: 'Zakladatel & Hlavní detektiv',
            email: 'bartolomej@arbiq.cz',
            phone: '+420725932729',
            image: '/tym/bartolomej.jpg',
            knowsAbout: [
              'Generative Engine Optimization',
              'Search Engine Optimization',
              'Next.js',
              'Web Development',
              'Marketing Automation',
              'AI Implementation',
              'Business Strategy',
            ],
          }),
          personSchema({
            slug: 'matyas-petr',
            name: 'Matýáš Petr',
            jobTitle: 'Kameraman & Střihač',
            image: '/tym/petr.jpg',
            knowsAbout: ['Video Production', 'Cinematography', 'Post-production', 'BMAGIC Camera'],
          }),
          personSchema({
            slug: 'vaclav-plachejda',
            name: 'Václav Plachejda',
            jobTitle: 'Developer',
            knowsAbout: ['Marketing Automation', 'Custom Systems', 'Workflow Optimization', 'API Integration'],
          }),
          personSchema({
            slug: 'fidelio-seidl',
            name: 'Fidelio Seidl',
            jobTitle: 'Key Account Manager',
            email: 'info@arbiq.cz',
            image: '/tym/fidelio.jpg',
            knowsAbout: ['Client Management', 'Project Management', 'Business Development'],
          }),
          breadcrumbSchema({
            path: '/tym',
            items: [
              { name: 'ARBIQ', url: '/' },
              { name: 'Tým', url: '/tym' },
            ],
          }),
        ]}
      />
      {children}
    </>
  );
}
