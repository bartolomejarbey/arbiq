import 'server-only';
import { Document, Page, View, Text, Image, renderToBuffer } from '@react-pdf/renderer';
import { Buffer } from 'node:buffer';
import {
  COLORS,
  styles,
  registerArbiqFonts,
  loadLogoDataUrl,
  loadLynxMarkDataUrl,
  formatCzechDate,
} from './styles';
import type { Dodavatel } from '@/lib/config/dodavatel';

export type QuoteItem = {
  label: string;
  description?: string | null;
  quantity: number;
  unit?: string | null;
  unit_price: number;
};

export type QuoteCustomer = {
  full_name: string;
  company?: string | null;
  ico?: string | null;
  dic?: string | null;
  street?: string | null;
  city?: string | null;
  email?: string | null;
  phone?: string | null;
  representative?: string | null;
};

export type QuoteDoc = {
  quoteNumber: string;
  title: string;
  introText?: string | null;
  items: QuoteItem[];
  totalPrice: number;
  currency: string;
  validUntil: string;       // YYYY-MM-DD
  paymentTerms: string;
  deadlineDays: number;
  issuedAt?: string;        // YYYY-MM-DD, default today
};

function fmtMoney(value: number, currency = 'CZK'): string {
  return new Intl.NumberFormat('cs-CZ', { style: 'currency', currency, maximumFractionDigits: 0 }).format(value);
}

export async function renderNabidkaPdf(opts: {
  doc: QuoteDoc;
  customer: QuoteCustomer;
  dodavatel: Dodavatel;
}): Promise<Buffer> {
  registerArbiqFonts();
  const { doc, customer, dodavatel } = opts;
  const logo = loadLogoDataUrl();
  const lynx = loadLynxMarkDataUrl();
  const currency = doc.currency ?? 'CZK';
  const today = doc.issuedAt ?? new Date().toISOString().slice(0, 10);
  const validUntilDisplay = formatCzechDate(doc.validUntil);
  const issuedDisplay = formatCzechDate(today);
  const klientLabel = customer.company ?? customer.full_name;

  const PROCESS_STEPS = [
    { num: '01', title: 'Akceptace', text: `Odpovězte e-mailem z ${customer.email ?? '[váš e-mail]'} na ${dodavatel.email} potvrzením této nabídky.` },
    { num: '02', title: 'Záloha', text: doc.paymentTerms.split(',')[0] || 'Záloha 50 % dle smlouvy o dílo.' },
    { num: '03', title: 'Realizace', text: `Práce zahájíme do 3 pracovních dnů. Termín dodání ${doc.deadlineDays} kalendářních dnů.` },
    { num: '04', title: 'Předání', text: 'Předání e-mailem nebo na sjednané URL + doplatek dle splatnosti.' },
  ];

  const pdfDoc = (
    <Document
      title={`Cenová nabídka ${doc.quoteNumber}`}
      author={dodavatel.brand}
      creator="ARBIQ portal"
      producer="@react-pdf/renderer"
    >
      <Page size="A4" style={styles.page} wrap>
        {/* Per-page corner */}
        <View
          fixed
          style={{
            position: 'absolute',
            top: 24,
            right: 30,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
          }}
        >
          {lynx ? <Image src={lynx} style={{ width: 22, height: 22 }} /> : <Text> </Text>}
          <Text
            style={{
              fontFamily: 'Inter',
              fontSize: 7.5,
              color: COLORS.caramel,
              textTransform: 'uppercase',
              letterSpacing: 1.6,
              fontWeight: 600,
            }}
          >
            {dodavatel.brand} · {doc.quoteNumber}
          </Text>
        </View>

        <Text
          fixed
          style={{
            position: 'absolute',
            bottom: 22,
            left: 0,
            right: 0,
            textAlign: 'center',
            fontFamily: 'Inter',
            fontSize: 7.5,
            color: COLORS.sandstone,
            textTransform: 'uppercase',
            letterSpacing: 2,
          }}
          render={({ pageNumber, totalPages }) =>
            `Strana ${String(pageNumber).padStart(2, '0')} / ${String(totalPages).padStart(2, '0')}  ·  Platnost do ${validUntilDisplay}  ·  ${dodavatel.website}`
          }
        />

        {/* HERO */}
        <View style={{ alignItems: 'center', marginTop: 18 }}>
          {logo ? <Image src={logo} style={{ width: 84, height: 84, marginBottom: 14 }} /> : <Text> </Text>}
          <Text
            style={{
              fontFamily: 'Inter',
              fontSize: 9,
              fontWeight: 600,
              color: COLORS.caramel,
              textTransform: 'uppercase',
              letterSpacing: 4,
              marginBottom: 10,
            }}
          >
            Cenová nabídka
          </Text>
          <Text
            style={{
              fontFamily: 'Newsreader',
              fontSize: 36,
              fontWeight: 700,
              color: COLORS.ink,
              textAlign: 'center',
              letterSpacing: -0.4,
              lineHeight: 1.15,
              maxWidth: 460,
            }}
          >
            {doc.title}
          </Text>
          <View style={{ width: 50, height: 1.5, backgroundColor: COLORS.caramel, marginTop: 12, marginBottom: 12 }} />
          <View
            style={{
              flexDirection: 'row',
              gap: 18,
              alignItems: 'center',
            }}
          >
            <Text style={{ fontFamily: 'Inter', fontSize: 8, color: COLORS.sandstone, textTransform: 'uppercase', letterSpacing: 1.5 }}>
              Nabídka č.
            </Text>
            <Text style={{ fontFamily: 'Inter', fontSize: 11, fontWeight: 700, color: COLORS.caramel }}>
              {doc.quoteNumber}
            </Text>
            <Text style={{ fontFamily: 'Inter', fontSize: 8, color: COLORS.sandstone }}>·</Text>
            <Text style={{ fontFamily: 'Inter', fontSize: 9, color: COLORS.sandstone }}>Vystaveno {issuedDisplay}</Text>
            <Text style={{ fontFamily: 'Inter', fontSize: 8, color: COLORS.sandstone }}>·</Text>
            <Text style={{ fontFamily: 'Inter', fontSize: 9, color: COLORS.caramel, fontWeight: 600 }}>
              Platnost do {validUntilDisplay}
            </Text>
          </View>
        </View>

        {/* Pro koho */}
        <View style={{ marginTop: 34, paddingHorizontal: 20, paddingVertical: 18, backgroundColor: COLORS.parchment }}>
          <Text style={styles.eyebrow}>Pro</Text>
          <Text style={[styles.h2, { fontSize: 22, marginTop: 4 }]}>{klientLabel}</Text>
          {customer.company && (
            <Text style={{ ...styles.body, fontStyle: 'italic', color: COLORS.inkSoft }}>{customer.full_name}</Text>
          )}
          {customer.street && (
            <Text style={styles.body}>
              {customer.street}
              {customer.city ? `, ${customer.city}` : ''}
            </Text>
          )}
          {customer.ico && <Text style={styles.body}>IČO: {customer.ico}</Text>}
          {customer.email && (
            <Text style={{ ...styles.body, marginTop: 4, color: COLORS.caramel }}>{customer.email}</Text>
          )}
        </View>

        {/* Intro */}
        {doc.introText && (
          <View style={{ marginTop: 22 }}>
            <Text
              style={{
                fontFamily: 'Newsreader',
                fontSize: 12,
                fontStyle: 'italic',
                color: COLORS.inkSoft,
                lineHeight: 1.6,
              }}
            >
              {doc.introText}
            </Text>
          </View>
        )}

        {/* Items */}
        <View style={{ marginTop: 28 }}>
          <Text
            style={{
              fontFamily: 'Inter',
              fontSize: 8,
              fontWeight: 600,
              color: COLORS.caramel,
              textTransform: 'uppercase',
              letterSpacing: 2.5,
              marginBottom: 10,
            }}
          >
            Rozsah a investice
          </Text>
          <View style={styles.tableHead}>
            <Text style={[styles.tableHeadCell, { flex: 5 }]}>Položka</Text>
            <Text style={[styles.tableHeadCell, { flex: 1, textAlign: 'right' }]}>Množ.</Text>
            <Text style={[styles.tableHeadCell, { flex: 1.5, textAlign: 'right' }]}>Cena</Text>
            <Text style={[styles.tableHeadCell, { flex: 1.5, textAlign: 'right' }]}>Celkem</Text>
          </View>
          {doc.items.map((it, idx) => (
            <View key={idx} style={styles.tableRow} wrap={false}>
              <View style={{ flex: 5 }}>
                <Text style={{ fontFamily: 'Inter', fontWeight: 700, color: COLORS.ink, fontSize: 10.5 }}>{it.label}</Text>
                {it.description ? <Text style={{ ...styles.muted, marginTop: 2 }}>{it.description}</Text> : <Text> </Text>}
              </View>
              <Text style={[styles.tableCell, { flex: 1, textAlign: 'right' }]}>
                {it.quantity}
                {it.unit ? ` ${it.unit}` : ''}
              </Text>
              <Text style={[styles.tableCell, { flex: 1.5, textAlign: 'right' }]}>{fmtMoney(it.unit_price, currency)}</Text>
              <Text style={[styles.tableCell, { flex: 1.5, textAlign: 'right', fontWeight: 700, color: COLORS.ink }]}>
                {fmtMoney(it.quantity * it.unit_price, currency)}
              </Text>
            </View>
          ))}
        </View>

        {/* Investice banner */}
        <View
          wrap={false}
          style={{
            marginTop: 24,
            backgroundColor: COLORS.coffee,
            paddingVertical: 22,
            paddingHorizontal: 26,
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <View>
            <Text
              style={{
                fontFamily: 'Inter',
                fontSize: 8,
                fontWeight: 600,
                color: COLORS.parchmentGold,
                textTransform: 'uppercase',
                letterSpacing: 3,
                marginBottom: 6,
              }}
            >
              Celková investice
            </Text>
            <Text style={{ fontFamily: 'Inter', fontSize: 10, color: COLORS.sepia }}>{doc.paymentTerms}</Text>
            {!dodavatel.vat_payer && (
              <Text style={{ fontFamily: 'Inter', fontSize: 8.5, color: COLORS.sandstone, fontStyle: 'italic', marginTop: 4 }}>
                Zhotovitel není plátcem DPH · cena je konečná
              </Text>
            )}
          </View>
          <Text
            style={{
              fontFamily: 'Newsreader',
              fontSize: 42,
              fontWeight: 700,
              color: COLORS.parchmentGold,
              letterSpacing: -1.5,
            }}
          >
            {fmtMoney(doc.totalPrice, currency)}
          </Text>
        </View>

        {/* Process */}
        <View wrap={false} style={{ marginTop: 30 }}>
          <Text
            style={{
              fontFamily: 'Inter',
              fontSize: 8,
              fontWeight: 600,
              color: COLORS.caramel,
              textTransform: 'uppercase',
              letterSpacing: 2.5,
              textAlign: 'center',
              marginBottom: 14,
            }}
          >
            Jak postupujeme
          </Text>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            {PROCESS_STEPS.map((s, i) => (
              <View key={i} style={{ flex: 1, padding: 12, borderLeftWidth: 2, borderLeftColor: COLORS.caramel }}>
                <Text
                  style={{
                    fontFamily: 'Newsreader',
                    fontSize: 22,
                    fontWeight: 700,
                    color: COLORS.caramel,
                    marginBottom: 4,
                  }}
                >
                  {s.num}
                </Text>
                <Text
                  style={{
                    fontFamily: 'Inter',
                    fontSize: 10,
                    fontWeight: 700,
                    color: COLORS.ink,
                    marginBottom: 4,
                  }}
                >
                  {s.title}
                </Text>
                <Text style={{ fontFamily: 'Inter', fontSize: 8.5, color: COLORS.inkSoft, lineHeight: 1.45 }}>
                  {s.text}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Akceptace */}
        <View wrap={false} style={{ marginTop: 26, padding: 18, backgroundColor: COLORS.parchment }}>
          <Text style={styles.eyebrow}>Jak akceptujete nabídku</Text>
          <Text style={{ fontFamily: 'Newsreader', fontSize: 13, color: COLORS.ink, marginTop: 6, lineHeight: 1.55 }}>
            Odpovězte e-mailem z adresy{' '}
            <Text style={{ fontWeight: 700, color: COLORS.caramel }}>{customer.email ?? '[váš e-mail]'}</Text>
            {' '}na{' '}
            <Text style={{ fontWeight: 700, color: COLORS.caramel }}>{dodavatel.email}</Text>
            {' '}s textem „Závazně objednávám sjednané služby a potvrzuji obsah cenové nabídky {doc.quoteNumber}." Okamžikem doručení tohoto e-mailu vzniká závazek; vystavíme zálohovou fakturu a smlouvu o dílo k podpisu.
          </Text>
          <Text style={{ fontFamily: 'Inter', fontSize: 9, color: COLORS.sandstone, marginTop: 8, fontStyle: 'italic' }}>
            Platnost této nabídky končí {validUntilDisplay}. Po tomto datu si vyhrazujeme právo cenu přepočítat dle aktuálních podmínek.
          </Text>
        </View>

        {/* Děkujeme */}
        <View wrap={false} style={{ marginTop: 28, alignItems: 'center' }}>
          <View style={{ width: 40, height: 1.5, backgroundColor: COLORS.caramel, marginBottom: 14 }} />
          <Text
            style={{
              fontFamily: 'Newsreader',
              fontSize: 16,
              fontStyle: 'italic',
              color: COLORS.ink,
              textAlign: 'center',
            }}
          >
            Těšíme se na spolupráci.
          </Text>
          <Text
            style={{
              fontFamily: 'Newsreader',
              fontSize: 12,
              fontStyle: 'italic',
              color: COLORS.sandstone,
              textAlign: 'center',
              marginTop: 4,
            }}
          >
            {dodavatel.name} · {dodavatel.brand}
          </Text>
        </View>
      </Page>
    </Document>
  );

  return await renderToBuffer(pdfDoc);
}
