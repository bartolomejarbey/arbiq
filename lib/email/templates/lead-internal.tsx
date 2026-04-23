import { styles, Field } from './_shared';

export type LeadInternalProps = {
  caseNumber: string;
  kampan: string;
  obor?: string | null;
  velikostFirmy?: string | null;
  step3Odpoved?: string | null;
  name: string;
  email: string;
  phone?: string | null;
  websiteUrl?: string | null;
  popis?: string | null;
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
};

export function LeadInternalEmail(props: LeadInternalProps) {
  return (
    <div>
      <h1 style={styles.h1}>Nový lead z reklamy</h1>
      <p style={styles.p}>
        Zaregistrován pod číslem <strong style={{ color: '#C9986A' }}>{props.caseNumber}</strong>{' '}
        z kampaně <strong style={{ color: '#D8DDE5' }}>{props.kampan}</strong>.
      </p>
      <hr style={styles.divider} />

      <Field label="Jméno">{props.name}</Field>
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
      <Field label="Web">
        {props.websiteUrl ? (
          <a href={props.websiteUrl} style={{ color: '#C9986A' }}>
            {props.websiteUrl}
          </a>
        ) : null}
      </Field>

      <hr style={styles.divider} />

      <Field label="Obor">{props.obor}</Field>
      <Field label="Velikost firmy">{props.velikostFirmy}</Field>
      <Field label="Odpověď na specifickou otázku">{props.step3Odpoved}</Field>
      <Field label="Vlastní popis">
        {props.popis ? (
          <span style={{ whiteSpace: 'pre-wrap' as const }}>{props.popis}</span>
        ) : null}
      </Field>

      <hr style={styles.divider} />

      <Field label="UTM source">{props.utmSource}</Field>
      <Field label="UTM medium">{props.utmMedium}</Field>
      <Field label="UTM campaign">{props.utmCampaign}</Field>

      <p style={{ ...styles.muted, marginTop: '24px' }}>
        {`Automatický úkol „Kontaktovat ${props.name} do 24h" byl vytvořen v CRM.`}
      </p>
    </div>
  );
}
