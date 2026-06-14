import { ImageResponse } from 'next/og';

export const runtime = 'nodejs';
export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

/**
 * Apple touch icon (180×180). Stejný brand monogram jako favicon, větší a
 * s rezervou na okrajích (iOS přidává zaoblení). Bez průhlednosti.
 */
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          background: '#18120e',
          padding: 16,
        }}
      >
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #2A2017 0%, #18120e 70%)',
            border: '7px solid #C9986A',
            color: '#F0D4A8',
            fontFamily: 'serif',
            fontWeight: 900,
            fontSize: 116,
            lineHeight: 1,
            paddingBottom: 6,
          }}
        >
          A
        </div>
      </div>
    ),
    size,
  );
}
