import { styles } from './_shared';

export type PortalNotificationProps = {
  heading: string;
  intro: string;
  ctaLabel: string;
  ctaUrl: string;
};

export function PortalNotificationEmail({ heading, intro, ctaLabel, ctaUrl }: PortalNotificationProps) {
  return (
    <div>
      <h1 style={styles.h1}>{heading}</h1>
      <p style={styles.p}>{intro}</p>
      <a href={ctaUrl} style={styles.button}>
        {ctaLabel}
      </a>
      <p style={{ ...styles.muted, marginTop: '16px' }}>
        {`E-mailové notifikace můžete vypnout v sekci „Nastavení" portálu.`}
      </p>
    </div>
  );
}
