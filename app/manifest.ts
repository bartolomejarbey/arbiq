import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'ARBIQ — Detektivní agentura pro digitální business',
    short_name: 'ARBIQ',
    description:
      'Vyšetřujeme proč váš digitální business nefunguje. Web, audit, nástroje, konzultace.',
    start_url: '/',
    display: 'standalone',
    background_color: '#18120e',
    theme_color: '#18120e',
    lang: 'cs',
    icons: [
      {
        src: '/arbiq-logo.png',
        sizes: '500x500',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/arbiq-logo-dark.png',
        sizes: '500x500',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
    categories: ['business', 'productivity', 'utilities'],
  };
}
