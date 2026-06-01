import { styles } from './_shared';

export type InvoiceDeliveryProps = {
  name: string;
  invoiceNumber: string;
  amount: string;
  dueDate: string;
  kindLabel: string;
};

/**
 * E-mail, kterým posíláme klientovi fakturu jako PDF PŘÍLOHU.
 * ZÁMĚRNĚ neobsahuje žádné tlačítko / odkaz do portálu — klient otevře
 * přiložené PDF přímo v mailu. Žádný reroute do klientské zóny.
 */
export function InvoiceDeliveryEmail({ name, invoiceNumber, amount, dueDate, kindLabel }: InvoiceDeliveryProps) {
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

      <p style={{ ...styles.muted, marginTop: '16px' }}>
        Platební údaje včetně QR platby najdete přímo v přiloženém PDF.
        V případě dotazů stačí odpovědět na tento e-mail.
      </p>
    </div>
  );
}
