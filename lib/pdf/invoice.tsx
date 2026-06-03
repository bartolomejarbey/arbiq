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
import { buildSpaydQrDataUrl } from '@/lib/payments/spayd';

export type InvoiceItem = {
  label: string;
  description?: string | null;
  quantity: number;
  unit?: string | null;
  unit_price: number;
};

export type InvoiceCustomer = {
  full_name: string;
  company?: string | null;
  ico?: string | null;
  dic?: string | null;
  street?: string | null;
  city?: string | null;
  email?: string | null;
  phone?: string | null;
};

export type InvoiceDoc = {
  invoiceNumber: string;
  kind: 'zaloha' | 'konecna' | 'dobropis' | 'paushal';
  issuedAt: string;
  taxableAt?: string | null;
  dueDate: string;
  variableSymbol?: string | null;
  constantSymbol?: string | null;
  paymentMethod?: 'bank' | 'card' | 'cash';
  currency?: string;
  items: InvoiceItem[];
  description?: string | null;
  contractRef?: string | null;
  totalOverride?: number;
};

const KIND_LABEL: Record<InvoiceDoc['kind'], string> = {
  zaloha: 'ZÁLOHOVÁ FAKTURA',
  konecna: 'FAKTURA',
  dobropis: 'DOBROPIS',
  paushal: 'PAUŠÁLNÍ FAKTURA',
};

const KIND_EYEBROW: Record<InvoiceDoc['kind'], string> = {
  zaloha: 'Výzva k úhradě zálohy · neplátce DPH',
  konecna: 'Daňový doklad · neplátce DPH',
  dobropis: 'Dobropis · neplátce DPH',
  paushal: 'Měsíční paušál · neplátce DPH',
};

function fmtMoney(value: number, currency = 'CZK'): string {
  return new Intl.NumberFormat('cs-CZ', { style: 'currency', currency, maximumFractionDigits: 2 }).format(value);
}

function fmtIsoDate(iso: string): string {
  const [y, m, d] = iso.split('-');
  return `${parseInt(d, 10)}. ${parseInt(m, 10)}. ${y}`;
}

export async function renderInvoicePdf(opts: {
  invoice: InvoiceDoc;
  customer: InvoiceCustomer;
  dodavatel: Dodavatel;
}): Promise<Buffer> {
  registerArbiqFonts();
  const { invoice, customer, dodavatel } = opts;
  const logo = loadLogoDataUrl();
  const lynx = loadLynxMarkDataUrl();
  const currency = invoice.currency ?? 'CZK';
  const subtotal =
    invoice.totalOverride ?? invoice.items.reduce((s, it) => s + it.quantity * it.unit_price, 0);
  const total = subtotal;
  const variableSymbol = invoice.variableSymbol ?? invoice.invoiceNumber.replace(/\D/g, '');

  let qrDataUrl = '';
  // Dobropis se neplatí (je to vrácení/oprava) → žádná QR platba.
  if (invoice.paymentMethod !== 'cash' && invoice.kind !== 'dobropis') {
    try {
      qrDataUrl = await buildSpaydQrDataUrl({
        iban: dodavatel.iban,
        bic: dodavatel.bic,
        amount: total,
        currency,
        variableSymbol,
        constantSymbol: invoice.constantSymbol ?? undefined,
        message: `Faktura ${invoice.invoiceNumber}`,
        // dueDate ZÁMĚRNĚ nepředáváme — banka by jinak platbu naplánovala
        // na ten den místo provedení ihned.
      });
    } catch {
      qrDataUrl = '';
    }
  }

  const title = KIND_LABEL[invoice.kind];
  const eyebrow = KIND_EYEBROW[invoice.kind];

  const pdfDoc = (
    <Document
      title={`${title} ${invoice.invoiceNumber}`}
      author={dodavatel.brand}
      creator="ARBIQ portal"
      producer="@react-pdf/renderer"
    >
      <Page size="A4" style={styles.page} wrap>
        {/* ============ FIXED CORNER MARKS ============ */}
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
            {dodavatel.brand} · {invoice.invoiceNumber}
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
            `Strana ${String(pageNumber).padStart(2, '0')} / ${String(totalPages).padStart(2, '0')}  ·  ${dodavatel.website}  ·  ${dodavatel.email}`
          }
        />

        {/* ============ HERO ============ */}
        <View style={{ marginTop: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <View style={{ maxWidth: 360 }}>
            <Text
              style={{
                fontFamily: 'Inter',
                fontSize: 8,
                fontWeight: 600,
                color: COLORS.caramel,
                textTransform: 'uppercase',
                letterSpacing: 3,
                marginBottom: 8,
              }}
            >
              {eyebrow}
            </Text>
            <Text
              style={{
                fontFamily: 'Newsreader',
                fontSize: 44,
                fontWeight: 700,
                color: COLORS.ink,
                letterSpacing: -1,
                lineHeight: 1.05,
              }}
            >
              {title}
            </Text>
            <Text
              style={{
                fontFamily: 'Inter',
                fontSize: 18,
                color: COLORS.caramel,
                marginTop: 6,
                fontWeight: 700,
                letterSpacing: 0.5,
              }}
            >
              č. {invoice.invoiceNumber}
            </Text>
          </View>
          {logo ? (
            <Image src={logo} style={{ width: 72, height: 72 }} />
          ) : (
            <Text> </Text>
          )}
        </View>

        {/* ============ DATES BAR ============ */}
        <View
          style={{
            marginTop: 22,
            backgroundColor: COLORS.parchment,
            paddingVertical: 14,
            paddingHorizontal: 18,
            flexDirection: 'row',
            justifyContent: 'space-between',
            gap: 20,
          }}
        >
          <View>
            <Text style={styles.eyebrow}>Vystaveno</Text>
            <Text style={{ fontFamily: 'Inter', fontWeight: 700, color: COLORS.ink, fontSize: 11, marginTop: 2 }}>
              {fmtIsoDate(invoice.issuedAt)}
            </Text>
          </View>
          {invoice.taxableAt && (
            <View>
              <Text style={styles.eyebrow}>Datum zdan. plnění</Text>
              <Text style={{ fontFamily: 'Inter', fontWeight: 700, color: COLORS.ink, fontSize: 11, marginTop: 2 }}>
                {fmtIsoDate(invoice.taxableAt)}
              </Text>
            </View>
          )}
          <View>
            <Text style={styles.eyebrow}>Splatnost</Text>
            <Text style={{ fontFamily: 'Inter', fontWeight: 700, color: COLORS.caramel, fontSize: 11, marginTop: 2 }}>
              {fmtIsoDate(invoice.dueDate)}
            </Text>
          </View>
          <View>
            <Text style={styles.eyebrow}>Forma úhrady</Text>
            <Text style={{ fontFamily: 'Inter', fontWeight: 700, color: COLORS.ink, fontSize: 11, marginTop: 2 }}>
              {invoice.paymentMethod === 'cash'
                ? 'Hotově'
                : invoice.paymentMethod === 'card'
                  ? 'Kartou'
                  : 'Bankovní převod'}
            </Text>
          </View>
        </View>

        {/* ============ PARTIES ============ */}
        <View style={{ marginTop: 18, flexDirection: 'row', gap: 14 }}>
          <View
            style={{
              flex: 1,
              padding: 16,
              backgroundColor: '#FFFFFF',
              borderLeftWidth: 3,
              borderLeftColor: COLORS.caramel,
            }}
          >
            <Text style={styles.eyebrow}>Dodavatel</Text>
            <Text style={[styles.h3, { marginTop: 4 }]}>{dodavatel.name}</Text>
            <Text style={styles.body}>{dodavatel.street}</Text>
            <Text style={styles.body}>{dodavatel.city}</Text>
            <Text style={styles.body}>IČO: {dodavatel.ico}</Text>
            <Text style={styles.muted}>
              {dodavatel.vat_payer && dodavatel.dic ? `DIČ: ${dodavatel.dic}` : 'Neplátce DPH'}
            </Text>
            <View style={{ height: 1, backgroundColor: COLORS.divider, marginVertical: 8 }} />
            <Text style={{ ...styles.body, color: COLORS.caramel, fontWeight: 600 }}>{dodavatel.email}</Text>
            <Text style={styles.body}>{dodavatel.phone}</Text>
            <Text style={{ ...styles.body, color: COLORS.caramel }}>{dodavatel.website}</Text>
          </View>
          <View
            style={{
              flex: 1,
              padding: 16,
              backgroundColor: '#FFFFFF',
              borderLeftWidth: 3,
              borderLeftColor: COLORS.sandstone,
            }}
          >
            <Text style={styles.eyebrow}>Odběratel</Text>
            <Text style={[styles.h3, { marginTop: 4 }]}>{customer.company ?? customer.full_name}</Text>
            {customer.company && <Text style={{ ...styles.body, fontStyle: 'italic' }}>{customer.full_name}</Text>}
            {customer.street && <Text style={styles.body}>{customer.street}</Text>}
            {customer.city && <Text style={styles.body}>{customer.city}</Text>}
            {customer.ico && <Text style={styles.body}>IČO: {customer.ico}</Text>}
            {customer.dic && <Text style={styles.body}>DIČ: {customer.dic}</Text>}
            {(customer.email || customer.phone) && (
              <View style={{ height: 1, backgroundColor: COLORS.divider, marginVertical: 8 }} />
            )}
            {customer.email ? <Text style={styles.body}>{customer.email}</Text> : <Text> </Text>}
            {customer.phone ? <Text style={styles.body}>{customer.phone}</Text> : <Text> </Text>}
          </View>
        </View>

        {/* ============ PAYMENT DETAILS ============ */}
        <View
          style={{
            marginTop: 14,
            padding: 16,
            backgroundColor: COLORS.parchment,
            flexDirection: 'row',
            justifyContent: 'space-between',
            gap: 20,
          }}
        >
          <View style={{ flex: 1 }}>
            <Text style={styles.eyebrow}>Číslo účtu</Text>
            <Text style={[styles.h3, { marginTop: 4 }]}>{dodavatel.bank_account}</Text>
            <Text style={{ ...styles.muted, marginTop: 6 }}>Banka: {dodavatel.bank_name}</Text>
            <Text style={styles.muted}>IBAN: {dodavatel.iban}</Text>
            {dodavatel.bic ? <Text style={styles.muted}>BIC: {dodavatel.bic}</Text> : <Text> </Text>}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.eyebrow}>Variabilní symbol</Text>
            <Text style={[styles.h3, { marginTop: 4, color: COLORS.caramel, fontSize: 14 }]}>{variableSymbol}</Text>
            {invoice.constantSymbol && (
              <>
                <Text style={{ ...styles.eyebrow, marginTop: 8 }}>Konstantní symbol</Text>
                <Text style={styles.body}>{invoice.constantSymbol}</Text>
              </>
            )}
            <Text style={{ ...styles.eyebrow, marginTop: 8 }}>Zpráva pro příjemce</Text>
            <Text style={styles.body}>Faktura {invoice.invoiceNumber}</Text>
          </View>
        </View>

        {/* ============ ITEMS TABLE ============ */}
        <View style={{ marginTop: 22 }}>
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
            Vyúčtování
          </Text>
          <View style={styles.tableHead}>
            <Text style={[styles.tableHeadCell, { flex: 4 }]}>Položka</Text>
            <Text style={[styles.tableHeadCell, { flex: 1, textAlign: 'right' }]}>Množství</Text>
            <Text style={[styles.tableHeadCell, { flex: 1.5, textAlign: 'right' }]}>Cena / ks</Text>
            <Text style={[styles.tableHeadCell, { flex: 1.5, textAlign: 'right' }]}>Celkem</Text>
          </View>
          {invoice.items.map((it, idx) => (
            <View key={idx} style={styles.tableRow} wrap={false}>
              <View style={{ flex: 4 }}>
                <Text style={{ fontFamily: 'Inter', fontWeight: 700, color: COLORS.ink, fontSize: 10.5 }}>
                  {it.label}
                </Text>
                {it.description ? (
                  <Text style={{ ...styles.muted, marginTop: 2 }}>{it.description}</Text>
                ) : (
                  <Text> </Text>
                )}
              </View>
              <Text style={[styles.tableCell, { flex: 1, textAlign: 'right' }]}>
                {it.quantity}
                {it.unit ? ` ${it.unit}` : ''}
              </Text>
              <Text style={[styles.tableCell, { flex: 1.5, textAlign: 'right' }]}>
                {fmtMoney(it.unit_price, currency)}
              </Text>
              <Text style={[styles.tableCell, { flex: 1.5, textAlign: 'right', fontWeight: 700, color: COLORS.ink }]}>
                {fmtMoney(it.quantity * it.unit_price, currency)}
              </Text>
            </View>
          ))}
        </View>

        {/* ============ TOTALS BAND + QR ============ */}
        <View
          wrap={false}
          style={{
            marginTop: 26,
            backgroundColor: COLORS.coffee,
            paddingVertical: 22,
            paddingHorizontal: 24,
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 24,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 18 }}>
            {qrDataUrl ? (
              <View style={{ alignItems: 'center' }}>
                <Image src={qrDataUrl} style={{ width: 110, height: 110, backgroundColor: '#FFFFFF', padding: 4 }} />
                <Text
                  style={{
                    fontFamily: 'Inter',
                    fontSize: 7.5,
                    color: COLORS.parchmentGold,
                    textTransform: 'uppercase',
                    letterSpacing: 1.6,
                    marginTop: 4,
                  }}
                >
                  QR platba
                </Text>
              </View>
            ) : (
              <Text> </Text>
            )}
            <View>
              <Text
                style={{
                  fontFamily: 'Inter',
                  fontSize: 8,
                  fontWeight: 600,
                  color: COLORS.parchmentGold,
                  textTransform: 'uppercase',
                  letterSpacing: 3,
                  marginBottom: 4,
                }}
              >
                {invoice.kind === 'dobropis' ? 'Opravná částka' : 'K úhradě'}
              </Text>
              <Text style={{ fontFamily: 'Inter', fontSize: 9.5, color: COLORS.sepia }}>
                Mezisoučet  {fmtMoney(subtotal, currency)}
              </Text>
              <Text style={{ fontFamily: 'Inter', fontSize: 9.5, color: COLORS.sepia }}>
                DPH {dodavatel.vat_payer ? '' : '(neplátce)'}  {fmtMoney(0, currency)}
              </Text>
            </View>
          </View>
          <Text
            style={{
              fontFamily: 'Newsreader',
              fontSize: 44,
              fontWeight: 700,
              color: COLORS.parchmentGold,
              letterSpacing: -1.5,
            }}
          >
            {fmtMoney(total, currency)}
          </Text>
        </View>

        {/* ============ NOTES ============ */}
        {(invoice.description || invoice.contractRef) && (
          <View style={{ marginTop: 22 }} wrap={false}>
            <Text style={styles.eyebrow}>Poznámky</Text>
            {invoice.description ? (
              <Text style={{ ...styles.body, marginTop: 4 }}>{invoice.description}</Text>
            ) : (
              <Text> </Text>
            )}
            {invoice.contractRef ? (
              <Text style={{ ...styles.body, marginTop: 4 }}>
                Souvisí se smlouvou: {invoice.contractRef}.
              </Text>
            ) : (
              <Text> </Text>
            )}
          </View>
        )}

        {/* ============ DĚKUJEME ============ */}
        <View wrap={false} style={{ marginTop: 32, alignItems: 'center' }}>
          <View style={{ width: 36, height: 1.5, backgroundColor: COLORS.caramel, marginBottom: 14 }} />
          <Text
            style={{
              fontFamily: 'Newsreader',
              fontSize: 14,
              fontStyle: 'italic',
              color: COLORS.ink,
              textAlign: 'center',
            }}
          >
            Děkujeme za spolupráci.
          </Text>
          <Text
            style={{
              fontFamily: 'Newsreader',
              fontSize: 11,
              fontStyle: 'italic',
              color: COLORS.sandstone,
              textAlign: 'center',
              marginTop: 4,
            }}
          >
            V případě dotazů k fakturaci napište na {dodavatel.email}.
          </Text>
          <Text
            style={{
              fontFamily: 'Inter',
              fontSize: 8,
              color: COLORS.sandstone,
              textTransform: 'uppercase',
              letterSpacing: 2,
              marginTop: 10,
            }}
          >
            Vystaveno {formatCzechDate(invoice.issuedAt)}
          </Text>
        </View>
      </Page>
    </Document>
  );

  return await renderToBuffer(pdfDoc);
}
