import 'server-only';
import { Document, Page, View, Text, Image, renderToBuffer } from '@react-pdf/renderer';
import { Buffer } from 'node:buffer';
import { COLORS, styles, registerArbiqFonts, loadLogoDataUrl } from './styles';
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
  paushal: 'FAKTURA — PAUŠÁL',
};

function fmtMoney(value: number, currency = 'CZK'): string {
  return new Intl.NumberFormat('cs-CZ', { style: 'currency', currency, maximumFractionDigits: 2 }).format(value);
}
function fmtDate(iso: string): string {
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
  const currency = invoice.currency ?? 'CZK';
  const subtotal =
    invoice.totalOverride ?? invoice.items.reduce((s, it) => s + it.quantity * it.unit_price, 0);
  const total = subtotal;

  let qrDataUrl = '';
  if (invoice.paymentMethod !== 'cash') {
    try {
      qrDataUrl = await buildSpaydQrDataUrl({
        iban: dodavatel.iban,
        bic: dodavatel.bic,
        amount: total,
        currency,
        variableSymbol: invoice.variableSymbol ?? invoice.invoiceNumber.replace(/\D/g, ''),
        constantSymbol: invoice.constantSymbol ?? undefined,
        message: `Faktura ${invoice.invoiceNumber}`,
        dueDate: invoice.dueDate,
      });
    } catch {
      qrDataUrl = '';
    }
  }

  const title = KIND_LABEL[invoice.kind];

  const doc = (
    <Document
      title={`${title} ${invoice.invoiceNumber}`}
      author={dodavatel.brand}
      creator="ARBIQ portal"
      producer="@react-pdf/renderer"
    >
      <Page size="A4" style={styles.page}>
        <View style={styles.headerRow}>
          <View style={{ maxWidth: 360 }}>
            <Text style={styles.eyebrow}>
              {invoice.kind === 'zaloha' ? 'Výzva k úhradě zálohy' : 'Daňový doklad — neplátce DPH'}
            </Text>
            <Text style={[styles.h1, { fontSize: 40 }]}>{title}</Text>
            <Text style={{ color: COLORS.caramel, fontWeight: 700, fontSize: 14, marginTop: 4 }}>
              č. {invoice.invoiceNumber}
            </Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            {logo ? <Image src={logo} style={{ width: 56, height: 56, marginBottom: 6 }} /> : <Text> </Text>}
            <Text style={[styles.brandSubline, { color: COLORS.caramel }]}>{dodavatel.brand.toUpperCase()}</Text>
            <Text style={{ fontSize: 8.5, color: COLORS.sandstone, marginTop: 2 }}>{dodavatel.website}</Text>
          </View>
        </View>

        <View style={{ flexDirection: 'row', gap: 24, marginTop: 18 }}>
          <View style={styles.col}>
            <Text style={styles.eyebrow}>Datum vystavení</Text>
            <Text style={{ fontWeight: 700, color: COLORS.ink, fontSize: 11 }}>{fmtDate(invoice.issuedAt)}</Text>
          </View>
          {invoice.taxableAt && (
            <View style={styles.col}>
              <Text style={styles.eyebrow}>Datum zdan. plnění</Text>
              <Text style={{ fontWeight: 700, color: COLORS.ink, fontSize: 11 }}>{fmtDate(invoice.taxableAt)}</Text>
            </View>
          )}
          <View style={styles.col}>
            <Text style={styles.eyebrow}>Datum splatnosti</Text>
            <Text style={{ fontWeight: 700, color: COLORS.caramel, fontSize: 11 }}>{fmtDate(invoice.dueDate)}</Text>
          </View>
          <View style={styles.col}>
            <Text style={styles.eyebrow}>Forma úhrady</Text>
            <Text style={{ fontWeight: 700, color: COLORS.ink, fontSize: 11 }}>
              {invoice.paymentMethod === 'cash'
                ? 'Hotově'
                : invoice.paymentMethod === 'card'
                  ? 'Kartou'
                  : 'Bankovní převod'}
            </Text>
          </View>
        </View>

        <View style={styles.hairline} />

        <View style={styles.twoCol}>
          <View style={[styles.col, styles.parchmentBox]}>
            <Text style={styles.eyebrow}>Dodavatel</Text>
            <Text style={[styles.h3, { marginTop: 2 }]}>{dodavatel.name}</Text>
            <Text style={styles.body}>{dodavatel.street}</Text>
            <Text style={styles.body}>{dodavatel.city}</Text>
            <Text style={styles.body}>IČO: {dodavatel.ico}</Text>
            <Text style={styles.muted}>
              {dodavatel.vat_payer && dodavatel.dic ? `DIČ: ${dodavatel.dic}` : 'Neplátce DPH'}
            </Text>
            <Text style={{ ...styles.body, marginTop: 4, color: COLORS.caramel }}>{dodavatel.email}</Text>
            <Text style={styles.body}>{dodavatel.phone}</Text>
            <Text style={{ ...styles.body, color: COLORS.caramel }}>{dodavatel.website}</Text>
          </View>
          <View
            style={[
              styles.col,
              styles.parchmentBox,
              { backgroundColor: '#FFFFFF', borderLeftColor: COLORS.sandstone },
            ]}
          >
            <Text style={styles.eyebrow}>Odběratel</Text>
            <Text style={[styles.h3, { marginTop: 2 }]}>{customer.company ?? customer.full_name}</Text>
            {customer.company && <Text style={styles.body}>{customer.full_name}</Text>}
            {customer.street && <Text style={styles.body}>{customer.street}</Text>}
            {customer.city && <Text style={styles.body}>{customer.city}</Text>}
            {customer.ico && <Text style={styles.body}>IČO: {customer.ico}</Text>}
            {customer.dic && <Text style={styles.body}>DIČ: {customer.dic}</Text>}
            {customer.email && <Text style={{ ...styles.body, marginTop: 4 }}>{customer.email}</Text>}
            {customer.phone && <Text style={styles.body}>{customer.phone}</Text>}
          </View>
        </View>

        <View
          style={{
            marginTop: 14,
            padding: 14,
            backgroundColor: '#FFFFFF',
            borderWidth: 0.5,
            borderColor: COLORS.divider,
          }}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 16 }}>
            <View style={{ flex: 1 }}>
              <Text style={styles.eyebrow}>Číslo účtu</Text>
              <Text style={[styles.h3, { marginTop: 2 }]}>{dodavatel.bank_account}</Text>
              <Text style={{ ...styles.muted, marginTop: 4 }}>Banka: {dodavatel.bank_name}</Text>
              <Text style={styles.muted}>IBAN: {dodavatel.iban}</Text>
              {dodavatel.bic ? <Text style={styles.muted}>BIC: {dodavatel.bic}</Text> : <Text> </Text>}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.eyebrow}>Variabilní symbol</Text>
              <Text style={[styles.h3, { marginTop: 2, color: COLORS.caramel }]}>
                {invoice.variableSymbol ?? invoice.invoiceNumber.replace(/\D/g, '')}
              </Text>
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
        </View>

        <View style={{ marginTop: 20 }}>
          <View style={styles.tableHead}>
            <Text style={[styles.tableHeadCell, { flex: 4 }]}>Položka</Text>
            <Text style={[styles.tableHeadCell, { flex: 1, textAlign: 'right' }]}>Množství</Text>
            <Text style={[styles.tableHeadCell, { flex: 1.5, textAlign: 'right' }]}>Cena / ks</Text>
            <Text style={[styles.tableHeadCell, { flex: 1.5, textAlign: 'right' }]}>Celkem</Text>
          </View>
          {invoice.items.map((it, idx) => (
            <View key={idx} style={styles.tableRow}>
              <View style={{ flex: 4 }}>
                <Text style={{ fontWeight: 700, color: COLORS.ink, fontSize: 10.5 }}>{it.label}</Text>
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

        <View style={{ flexDirection: 'row', marginTop: 18, gap: 20 }}>
          <View style={{ width: 130 }}>
            {qrDataUrl ? <Image src={qrDataUrl} style={{ width: 130, height: 130 }} /> : <Text> </Text>}
            {qrDataUrl ? (
              <Text
                style={{
                  fontSize: 7.5,
                  color: COLORS.sandstone,
                  textAlign: 'center',
                  marginTop: 4,
                  textTransform: 'uppercase',
                  letterSpacing: 1.2,
                }}
              >
                QR platba
              </Text>
            ) : <Text> </Text>}
          </View>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 }}>
              <Text style={{ ...styles.muted }}>Mezisoučet</Text>
              <Text style={{ color: COLORS.inkSoft }}>{fmtMoney(subtotal, currency)}</Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 }}>
              <Text style={{ ...styles.muted }}>DPH {dodavatel.vat_payer ? '' : '(neplátce)'}</Text>
              <Text style={{ color: COLORS.inkSoft }}>{fmtMoney(0, currency)}</Text>
            </View>
            <View style={[styles.caramelBox, { marginTop: 8 }]}>
              <Text style={styles.caramelText}>K ÚHRADĚ</Text>
              <Text style={[styles.caramelText, { fontSize: 16 }]}>{fmtMoney(total, currency)}</Text>
            </View>
          </View>
        </View>

        {(invoice.description || invoice.contractRef) && (
          <View style={{ marginTop: 20 }}>
            <Text style={styles.eyebrow}>Poznámky</Text>
            {invoice.description ? <Text style={[styles.body, { marginTop: 4 }]}>{invoice.description}</Text> : <Text> </Text>}
            {invoice.contractRef ? (
              <Text style={{ ...styles.body, marginTop: 4 }}>
                Tato faktura souvisí se smlouvou: {invoice.contractRef}.
              </Text>
            ) : <Text> </Text>}
          </View>
        )}

        <Text style={styles.footerNote}>
          {dodavatel.vat_payer ? '' : 'Dodavatel není plátcem DPH. '}
          V případě dotazů kontaktujte {dodavatel.email}. Děkujeme za spolupráci.
        </Text>

        <Text
          style={styles.pageNumber}
          render={({ pageNumber, totalPages }) => (totalPages > 1 ? `${pageNumber} / ${totalPages}` : '')}
          fixed
        />
      </Page>
    </Document>
  );

  const out = await renderToBuffer(doc);
  return out;
}
