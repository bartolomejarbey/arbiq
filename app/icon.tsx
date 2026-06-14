import { ImageResponse } from 'next/og';

export const runtime = 'nodejs';
export const size = { width: 64, height: 64 };
export const contentType = 'image/png';

/**
 * Favicon — generovaný (next/og). Zlatě orámovaný „dossier" monogram A na
 * espresso podkladu. Ostrý i v 16–32 px (na rozdíl od fotorealistické mince).
 * Brand: ostré rohy, zlatá (caramel/parchment), espresso.
 */
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          background: '#18120e',
          padding: 4,
        }}
      >
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #2A2017 0%, #18120e 70%)',
            border: '3px solid #C9986A',
            color: '#F0D4A8',
            fontFamily: 'serif',
            fontWeight: 900,
            fontSize: 44,
            lineHeight: 1,
            paddingBottom: 2,
          }}
        >
          A
        </div>
      </div>
    ),
    size,
  );
}
