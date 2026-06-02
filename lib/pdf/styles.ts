import 'server-only';
import { Font, StyleSheet } from '@react-pdf/renderer';

/**
 * Centrální místo pro fonty + barevné tokeny PDF dokumentů ARBIQ.
 * Sepia paleta odpovídá design system v app/globals.css.
 */

let _fontsRegistered = false;

/** Registruje Inter (Czech support) + Newsreader (serif, smlouvy). Idempotent.
 *
 *  Fonts servujeme jako static assety přes vlastní doménu (public/fonts/*).
 *  Tahle cesta funguje spolehlivě v Vercel Lambda (žádné quirks s public/
 *  bundling, žádný external CDN, fetch sám na sebe = rychlý). Pro lokální
 *  dev používáme APP_URL=http://localhost:3000 ze .env.local. */
export function registerArbiqFonts(): void {
  if (_fontsRegistered) return;
  _fontsRegistered = true;

  const base = (process.env.APP_URL ?? 'https://arbiq.cz').replace(/\/$/, '');

  Font.register({
    family: 'Inter',
    fonts: [
      { src: `${base}/fonts/Inter-Regular.ttf`, fontWeight: 400 },
      { src: `${base}/fonts/Inter-SemiBold.ttf`, fontWeight: 600 },
      { src: `${base}/fonts/Inter-Bold.ttf`, fontWeight: 700 },
      { src: `${base}/fonts/Inter-Italic.ttf`, fontWeight: 400, fontStyle: 'italic' },
    ],
  });

  Font.register({
    family: 'Newsreader',
    fonts: [
      { src: `${base}/fonts/Newsreader-Regular.ttf`, fontWeight: 400 },
      { src: `${base}/fonts/Newsreader-Bold.ttf`, fontWeight: 700 },
      { src: `${base}/fonts/Newsreader-Italic.ttf`, fontWeight: 400, fontStyle: 'italic' },
      { src: `${base}/fonts/Newsreader-BoldItalic.ttf`, fontWeight: 700, fontStyle: 'italic' },
    ],
  });

  Font.registerHyphenationCallback((word: string) => [word]);
}

/** Vrátí URL pro PDF Image src — stejná strategie jako fonty (statika z arbiq.cz). */
function assetUrl(relPath: string): string {
  const base = (process.env.APP_URL ?? 'https://arbiq.cz').replace(/\/$/, '');
  return `${base}/${relPath.replace(/^\//, '')}`;
}

/** Hlavní logo s tmavým textem (white → espresso, hnědý rys zachovaný). */
export const loadLogoDataUrl = (): string => assetUrl('arbiq-logo-dark.png');

/** Cropped lynx (samotná maskotová ilustrace bez textu) — vhodné jako page corner mark. */
export const loadLynxMarkDataUrl = (): string => assetUrl('arbiq-mark.png');

/** Naskenovaný podpis Bartoloměje Roty. */
export const loadSupplierSignatureDataUrl = (): string => assetUrl('signatures/bartolomej-rota.png');

const CZECH_MONTHS = [
  'ledna', 'února', 'března', 'dubna', 'května', 'června',
  'července', 'srpna', 'září', 'října', 'listopadu', 'prosince',
];

/** Formátuje datum jako "19. května 2026". Bez parametru = dnes. */
export function formatCzechDate(date?: Date | string): string {
  let d: Date;
  if (!date) {
    d = new Date();
  } else if (typeof date === 'string') {
    // Date-only 'YYYY-MM-DD' parsuj jako lokální datum (jinak UTC midnight může
    // posunout den v záporných timezonách).
    const m = date.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    d = m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : new Date(date);
  } else {
    d = date;
  }
  return `${d.getDate()}. ${CZECH_MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

export const COLORS = {
  espresso: '#18120e',
  coffee: '#241B14',
  tobacco: '#3A2D22',
  caramel: '#C9986A',
  caramelLight: '#DDB088',
  parchmentGold: '#F0D4A8',
  moonlight: '#D8DDE5',
  sepia: '#C4B59A',
  sandstone: '#8B7B65',
  parchment: '#EDE2CC',
  olive: '#7A8E5C',
  rust: '#B85A3E',
  paper: '#FAF6EF',
  ink: '#1F1A14',
  inkSoft: '#4A3E32',
  divider: '#D8C9B0',
} as const;

/** Sdílené styly pro ARBIQ PDF dokumenty (sepia téma na papíru). */
export const styles = StyleSheet.create({
  page: {
    backgroundColor: COLORS.paper,
    color: COLORS.ink,
    fontFamily: 'Inter',
    fontSize: 9.5,
    paddingTop: 48,
    paddingBottom: 56,
    paddingHorizontal: 48,
    lineHeight: 1.5,
  },
  pageSerif: {
    backgroundColor: COLORS.paper,
    color: COLORS.ink,
    fontFamily: 'Newsreader',
    fontSize: 10.5,
    paddingTop: 56,
    paddingBottom: 64,
    paddingHorizontal: 56,
    lineHeight: 1.55,
  },
  // Header
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  logo: { width: 48, height: 48 },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  brandText: {
    fontFamily: 'Newsreader',
    fontSize: 24,
    fontWeight: 700,
    color: COLORS.ink,
    letterSpacing: 1.5,
  },
  brandSubline: {
    fontFamily: 'Inter',
    fontSize: 7.5,
    color: COLORS.caramel,
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginTop: 2,
  },
  hairline: { borderBottomWidth: 0.75, borderBottomColor: COLORS.divider, marginVertical: 14 },

  // Section labels
  eyebrow: {
    fontSize: 7.5,
    color: COLORS.caramel,
    textTransform: 'uppercase',
    letterSpacing: 1.4,
    marginBottom: 4,
    fontWeight: 600,
  },
  h1: {
    fontFamily: 'Newsreader',
    fontSize: 36,
    fontWeight: 700,
    color: COLORS.ink,
    letterSpacing: 1,
    marginBottom: 4,
  },
  h2: {
    fontFamily: 'Newsreader',
    fontSize: 18,
    fontWeight: 700,
    color: COLORS.ink,
    marginBottom: 8,
  },
  h3: {
    fontFamily: 'Inter',
    fontSize: 11,
    fontWeight: 700,
    color: COLORS.ink,
    marginBottom: 4,
  },
  muted: { color: COLORS.sandstone, fontSize: 9 },
  body: { color: COLORS.inkSoft, fontSize: 10, lineHeight: 1.55 },

  // Highlights
  caramelBox: {
    backgroundColor: COLORS.caramel,
    color: '#FFFFFF',
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  caramelText: { color: '#FFFFFF', fontSize: 13, fontWeight: 700 },
  parchmentBox: {
    backgroundColor: COLORS.parchment,
    padding: 14,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.caramel,
  },

  // Two columns (Dodavatel/Odběratel)
  twoCol: { flexDirection: 'row', gap: 16 },
  col: { flex: 1 },

  // Table
  tableHead: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.ink,
    paddingBottom: 6,
    marginBottom: 6,
  },
  tableHeadCell: { fontSize: 8, fontWeight: 700, color: COLORS.ink, textTransform: 'uppercase', letterSpacing: 1.1 },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.divider,
  },
  tableCell: { fontSize: 10, color: COLORS.inkSoft },

  // Footer
  footerNote: {
    fontSize: 8,
    color: COLORS.sandstone,
    textAlign: 'center',
    marginTop: 24,
  },
  pageNumber: {
    position: 'absolute',
    bottom: 24,
    left: 0,
    right: 0,
    textAlign: 'center',
    fontSize: 8,
    color: COLORS.sandstone,
  },
});
