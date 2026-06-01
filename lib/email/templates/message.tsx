import { styles } from './_shared';

export type MessageEmailProps = {
  heading: string;
  name?: string | null;
  body: string;
  replyHint?: string | null;
};

/** Obecná textová zpráva (korespondence). Tělo je plain text, zachová odřádkování. */
export function MessageEmail({ heading, name, body, replyHint }: MessageEmailProps) {
  return (
    <div>
      <h1 style={styles.h1}>{heading}</h1>
      {name ? <p style={styles.p}>Dobrý den, {name},</p> : null}
      <p style={{ ...styles.p, whiteSpace: 'pre-wrap' }}>{body}</p>
      {replyHint ? (
        <>
          <hr style={styles.divider} />
          <p style={styles.muted}>{replyHint}</p>
        </>
      ) : null}
    </div>
  );
}
