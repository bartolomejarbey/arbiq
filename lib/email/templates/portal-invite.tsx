import { styles } from './_shared';

export type PortalInviteProps = {
  name: string;
  email: string;
  password: string;
  loginUrl: string;
};

export function PortalInviteEmail({ name, email, password, loginUrl }: PortalInviteProps) {
  return (
    <div>
      <h1 style={styles.h1}>Vítejte v klientské zóně ARBIQ.</h1>
      <p style={styles.p}>Dobrý den, {name},</p>
      <p style={styles.p}>
        byl Vám vytvořen přístup do klientského portálu, kde uvidíte stav svého projektu,
        faktury, dokumenty a budete s námi moci komunikovat.
      </p>

      <hr style={styles.divider} />

      <div style={styles.label}>Přihlašovací e-mail</div>
      <div style={styles.value}>{email}</div>

      <div style={styles.label}>Dočasné heslo</div>
      <div
        style={{
          ...styles.caseNumber,
          letterSpacing: '0.05em',
          fontSize: '15px',
        }}
      >
        {password}
      </div>

      <p style={{ ...styles.muted, margin: '4px 0 16px 0' }}>
        {`Heslo si po prvním přihlášení změňte v sekci „Nastavení".`}
      </p>

      <a href={loginUrl} style={styles.button}>
        Přihlásit se
      </a>

      <hr style={styles.divider} />

      <p style={styles.muted}>
        Pokud jste o přístup nežádali, dejte nám prosím vědět odpovědí na tento e-mail.
      </p>
    </div>
  );
}
