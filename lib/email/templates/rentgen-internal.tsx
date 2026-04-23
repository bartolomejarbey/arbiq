import { styles, Field } from './_shared';

export type RentgenInternalProps = {
  orderId: string;
  name: string;
  email: string;
  phone?: string | null;
  company?: string | null;
  websiteUrl: string;
  problemDescription?: string | null;
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
};

export function RentgenInternalEmail(props: RentgenInternalProps) {
  return (
    <div>
      <h1 style={styles.h1}>Nová objednávka Rentgenu</h1>
      <p style={styles.p}>
        Číslo objednávky: <strong style={{ color: '#C9986A' }}>{props.orderId}</strong>
      </p>
      <hr style={styles.divider} />

      <Field label="Jméno">{props.name}</Field>
      <Field label="Firma">{props.company}</Field>
      <Field label="E-mail">
        <a href={`mailto:${props.email}`} style={{ color: '#C9986A' }}>
          {props.email}
        </a>
      </Field>
      <Field label="Telefon">
        {props.phone ? (
          <a href={`tel:${props.phone}`} style={{ color: '#C9986A' }}>
            {props.phone}
          </a>
        ) : null}
      </Field>
      <Field label="Web k vyšetření">
        <a href={props.websiteUrl} style={{ color: '#C9986A' }}>
          {props.websiteUrl}
        </a>
      </Field>
      <Field label="Popis problému">
        {props.problemDescription ? (
          <span style={{ whiteSpace: 'pre-wrap' as const }}>{props.problemDescription}</span>
        ) : null}
      </Field>

      <hr style={styles.divider} />

      <Field label="UTM source">{props.utmSource}</Field>
      <Field label="UTM medium">{props.utmMedium}</Field>
      <Field label="UTM campaign">{props.utmCampaign}</Field>

      <p style={{ ...styles.muted, marginTop: '24px' }}>
        {`Automatický úkol „Zpracovat Rentgen pro ${props.name}" byl vytvořen v CRM.`}
      </p>
    </div>
  );
}
