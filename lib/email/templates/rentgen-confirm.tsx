import { styles } from './_shared';

export type RentgenConfirmProps = {
  name: string;
  orderId: string;
  websiteUrl: string;
};

export function RentgenConfirmEmail({ name, orderId, websiteUrl }: RentgenConfirmProps) {
  return (
    <div>
      <h1 style={styles.h1}>Vyšetřování zahájeno.</h1>
      <p style={styles.p}>Dobrý den, {name},</p>
      <p style={styles.p}>
        objednávka Rentgenu byla zaregistrována pod číslem:
      </p>
      <div style={styles.caseNumber}>{orderId}</div>
      <p style={styles.p}>
        Začínáme zkoumat <strong style={{ color: '#D8DDE5' }}>{websiteUrl}</strong>. Detailní
        report dostanete do <strong style={{ color: '#D8DDE5' }}>5 pracovních dní</strong>.
      </p>
      <p style={styles.p}>
        Pokyny k platbě jsme Vám poslali samostatným e-mailem (pokud nedorazil, zkontrolujte
        prosím spam, nebo nám napište).
      </p>
      <hr style={styles.divider} />
      <p style={styles.muted}>
        Mezitím si můžete prohlédnout, co všechno Rentgen typicky odhalí:{' '}
        <a href="https://arbiq.cz/rentgen" style={{ color: '#C9986A' }}>
          arbiq.cz/rentgen
        </a>
      </p>
    </div>
  );
}
