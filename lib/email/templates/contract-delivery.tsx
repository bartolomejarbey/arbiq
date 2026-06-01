import { styles } from './_shared';

export type ContractDeliveryProps = {
  name: string;
  contractNumber: string;
  title: string;
};

/**
 * E-mail, kterým posíláme klientovi smlouvu jako PDF PŘÍLOHU.
 * Bez odkazu do portálu — klient otevře přiložené PDF přímo v mailu.
 */
export function ContractDeliveryEmail({ name, contractNumber, title }: ContractDeliveryProps) {
  return (
    <div>
      <h1 style={styles.h1}>Smlouva {contractNumber}</h1>
      <p style={styles.p}>Dobrý den, {name},</p>
      <p style={styles.p}>
        v příloze tohoto e-mailu najdete smlouvu {`„${title}"`} (č. {contractNumber}) ve formátu PDF.
        Prosíme o její prostudování — v případě dotazů stačí odpovědět na tento e-mail.
      </p>

      <hr style={styles.divider} />

      <div style={styles.label}>Číslo smlouvy</div>
      <div style={styles.value}>{contractNumber}</div>

      <div style={styles.label}>Předmět</div>
      <div style={styles.value}>{title}</div>
    </div>
  );
}
