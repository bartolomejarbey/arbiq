import { styles } from './_shared';

export type InvoiceDeliveryProps = {
  name: string;
  invoiceNumber: string;
  amount: string;
  dueDate: string;
  kindLabel: string;
  /** PNG data URL SPAYD QR kódu (česká QR platba) — zobrazí se přímo v e-mailu. */
  qrDataUrl?: string | null;
  /** IBAN / číslo účtu k zobrazení vedle QR. */
  iban?: string | null;
  /** Variabilní symbol. */
  variableSymbol?: string | null;
};

/**
 * E-mail, kterým posíláme klientovi fakturu jako PDF PŘÍLOHU.
 * Obsahuje i QR platbu přímo v těle (nejen v PDF). Žádný reroute do zóny.
 */
export function InvoiceDeliveryEmail({ name, invoiceNumber, amount, dueDate, kindLabel, qrDataUrl, iban, variableSymbol }: InvoiceDeliveryProps) {
  return (
    <div>
      <h1 style={styles.h1}>{kindLabel} {invoiceNumber}</h1>
      <p style={styles.p}>Dobrý den, {name},</p>
      <p style={styles.p}>
        v příloze tohoto e-mailu najdete {kindLabel.toLowerCase()} {invoiceNumber} na částku {amount},
        splatnou {dueDate}. Doklad je přiložen jako PDF soubor.
      </p>

      <hr style={styles.divider} />

      <div style={styles.label}>Číslo dokladu</div>
      <div style={styles.value}>{invoiceNumber}</div>

      <div style={styles.label}>Částka k úhradě</div>
      <div style={styles.value}>{amount}</div>

      <div style={styles.label}>Splatnost</div>
      <div style={styles.value}>{dueDate}</div>

      {qrDataUrl ? (
        <>
          <hr style={styles.divider} />
          <div style={styles.label}>QR platba</div>
          <table role="presentation" cellPadding={0} cellSpacing={0} style={{ marginTop: '8px' }}>
            <tbody>
              <tr>
                <td style={{ verticalAlign: 'top', paddingRight: '16px' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={qrDataUrl} alt="QR platba" width={132} height={132} style={{ display: 'block', border: '6px solid #FFFFFF', background: '#FFFFFF' }} />
                </td>
                <td style={{ verticalAlign: 'top', fontSize: '13px', color: '#C4B59A', lineHeight: 1.7 }}>
                  Naskenujte v bankovní aplikaci.<br />
                  {iban ? (<><span style={{ color: '#8B7B65' }}>Účet:</span> {iban}<br /></>) : null}
                  {variableSymbol ? (<><span style={{ color: '#8B7B65' }}>VS:</span> {variableSymbol}<br /></>) : null}
                  <span style={{ color: '#8B7B65' }}>Částka:</span> {amount}
                </td>
              </tr>
            </tbody>
          </table>
        </>
      ) : null}

      <p style={{ ...styles.muted, marginTop: '16px' }}>
        Kompletní platební údaje najdete i v přiloženém PDF.
        V případě dotazů stačí odpovědět na tento e-mail.
      </p>
    </div>
  );
}
