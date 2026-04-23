import { styles, Field } from './_shared';

export type KontaktInternalProps = {
  name: string;
  email: string;
  phone?: string | null;
  type: 'general' | 'project' | 'consultation' | 'product';
  message: string;
};

const typeLabels: Record<KontaktInternalProps['type'], string> = {
  general: 'Obecný dotaz',
  project: 'Mám projekt',
  consultation: 'Konzultace',
  product: 'Dotaz k produktu',
};

export function KontaktInternalEmail(props: KontaktInternalProps) {
  return (
    <div>
      <h1 style={styles.h1}>Nová zpráva z kontaktního formuláře</h1>
      <p style={styles.p}>
        Typ: <strong style={{ color: '#D8DDE5' }}>{typeLabels[props.type]}</strong>
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
      <Field label="Zpráva">
        <span style={{ whiteSpace: 'pre-wrap' as const }}>{props.message}</span>
      </Field>
    </div>
  );
}
