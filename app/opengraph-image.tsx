import { ImageResponse } from 'next/og';

export const runtime = 'nodejs';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const alt = 'ARBIQ — Detektivní agentura pro digitální business';

/**
 * Globální fallback Open Graph image (1200×630, PNG).
 * Per-route override: vytvoř `opengraph-image.tsx` v daném route segmentu.
 */
export default async function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          background:
            'linear-gradient(135deg, #18120e 0%, #241B14 55%, #3A2D22 100%)',
          color: '#EDE2CC',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: 64,
          fontFamily: 'serif',
        }}
      >
        {/* HEADER ROW */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div
            style={{
              fontSize: 14,
              letterSpacing: 4,
              color: '#C9986A',
              textTransform: 'uppercase',
              fontWeight: 700,
            }}
          >
            arbiq.cz
          </div>
          <div style={{ height: 1, flex: 1, background: '#3A2D22' }} />
          <div
            style={{
              fontSize: 14,
              letterSpacing: 3,
              color: '#8B7B65',
              textTransform: 'uppercase',
            }}
          >
            Detektivní agentura
          </div>
        </div>

        {/* HERO */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div
            style={{
              fontSize: 22,
              color: '#C9986A',
              textTransform: 'uppercase',
              letterSpacing: 6,
              marginBottom: 16,
            }}
          >
            ARBIQ
          </div>
          <div
            style={{
              fontSize: 78,
              fontWeight: 700,
              color: '#D8DDE5',
              lineHeight: 1.05,
              letterSpacing: -1,
              maxWidth: 1000,
            }}
          >
            Detektivní agentura
          </div>
          <div
            style={{
              fontSize: 78,
              fontWeight: 700,
              color: '#C9986A',
              fontStyle: 'italic',
              lineHeight: 1.05,
              letterSpacing: -1,
              marginTop: 6,
            }}
          >
            pro digitální business.
          </div>
          <div
            style={{
              fontSize: 26,
              color: '#C4B59A',
              marginTop: 24,
              maxWidth: 900,
              lineHeight: 1.35,
            }}
          >
            Web · Audit · Nástroje · Konzultace. Jeden detektiv, jeden případ, jeden výsledek.
          </div>
        </div>

        {/* FOOTER */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div
            style={{
              fontSize: 16,
              color: '#8B7B65',
              textTransform: 'uppercase',
              letterSpacing: 3,
            }}
          >
            Harotas s.r.o. · Praha
          </div>
          <div
            style={{
              fontSize: 16,
              color: '#DDB088',
              textTransform: 'uppercase',
              letterSpacing: 3,
              fontWeight: 700,
            }}
          >
            arbiq.cz
          </div>
        </div>
      </div>
    ),
    size,
  );
}
