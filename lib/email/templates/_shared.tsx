import type { ReactNode } from 'react';

export const styles = {
  h1: {
    fontFamily: "Georgia, 'Times New Roman', serif",
    fontStyle: 'italic' as const,
    fontWeight: 900,
    color: '#D8DDE5',
    fontSize: '22px',
    margin: '0 0 16px 0',
    lineHeight: 1.3,
  },
  p: {
    margin: '0 0 14px 0',
    color: '#C4B59A',
  },
  muted: {
    color: '#8B7B65',
    fontSize: '13px',
  },
  label: {
    fontFamily: "'Courier New', monospace",
    fontSize: '11px',
    letterSpacing: '0.15em',
    textTransform: 'uppercase' as const,
    color: '#8B7B65',
    margin: '20px 0 4px 0',
  },
  value: {
    color: '#D8DDE5',
    margin: '0 0 12px 0',
    wordBreak: 'break-word' as const,
  },
  caseNumber: {
    fontFamily: "'Courier New', monospace",
    color: '#C9986A',
    fontSize: '14px',
    letterSpacing: '0.1em',
    padding: '10px 14px',
    border: '1px solid #C9986A',
    display: 'inline-block',
    margin: '8px 0 16px 0',
  },
  button: {
    display: 'inline-block',
    padding: '12px 22px',
    background: '#C9986A',
    color: '#18120e',
    fontFamily: "'Courier New', monospace",
    fontSize: '12px',
    letterSpacing: '0.18em',
    textTransform: 'uppercase' as const,
    textDecoration: 'none',
    margin: '12px 0',
  },
  divider: {
    border: 'none' as const,
    borderTop: '1px solid #3A2D22',
    margin: '20px 0',
  },
};

export function Field({ label, children }: { label: string; children: ReactNode }) {
  if (children === null || children === undefined || children === '') return null;
  return (
    <div>
      <div style={styles.label}>{label}</div>
      <div style={styles.value}>{children}</div>
    </div>
  );
}
