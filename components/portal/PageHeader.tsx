import type { ReactNode } from 'react';

export default function PageHeader({
  eyebrow,
  title,
  subtitle,
  actions,
}: {
  eyebrow?: string;
  title: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <header className="px-8 py-8 border-b border-tobacco bg-espresso flex items-start justify-between gap-6 flex-wrap">
      <div>
        {eyebrow && (
          <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-sandstone mb-3">
            {eyebrow}
          </div>
        )}
        <h1 className="font-display italic font-black text-moonlight text-3xl md:text-4xl leading-tight">
          {title}
        </h1>
        {subtitle && (
          <p className="text-sepia mt-2 max-w-2xl">{subtitle}</p>
        )}
      </div>
      {actions && <div className="shrink-0">{actions}</div>}
    </header>
  );
}
