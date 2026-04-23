import { styles } from './_shared';

export type LeadConfirmProps = {
  name: string;
  caseNumber: string;
};

export function LeadConfirmEmail({ name, caseNumber }: LeadConfirmProps) {
  return (
    <div>
      <h1 style={styles.h1}>Děkujeme, máme to.</h1>
      <p style={styles.p}>Dobrý den, {name},</p>
      <p style={styles.p}>
        děkujeme za vyplnění dotazníku. Vaše záležitost byla zaregistrována pod číslem:
      </p>
      <div style={styles.caseNumber}>{caseNumber}</div>
      <p style={styles.p}>
        Náš tým si Váš případ projde a do <strong style={{ color: '#D8DDE5' }}>24 hodin</strong>{' '}
        Vás bude kontaktovat obchodník s konkrétním návrhem dalšího postupu.
      </p>
      <p style={styles.p}>
        Mezitím si můžete prohlédnout případy, které jsme řešili pro klienty s podobným zadáním:
      </p>
      <a href="https://arbiq.cz/pripady" style={styles.button}>
        Podívat se na případy
      </a>
      <hr style={styles.divider} />
      <p style={styles.muted}>
        Pokud jste tento dotazník nevyplnili Vy, dejte nám prosím vědět odpovědí na tento e-mail.
      </p>
    </div>
  );
}
