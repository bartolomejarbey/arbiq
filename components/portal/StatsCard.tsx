import type { ReactNode } from 'react';

export default function StatsCard({
  label,
  value,
  hint,
  tone = 'default',
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  tone?: 'default' | 'accent' | 'danger' | 'success';
}) {
  const valueColor =
    tone === 'accent' ? 'text-caramel' :
    tone === 'danger' ? 'text-rust' :
    tone === 'success' ? 'text-olive' :
    'text-moonlight';

  return (
    <div className="bg-coffee p-6">
      <div className="font-mono text-[10px] uppercase tracking-widest text-sandstone mb-3">
        {label}
      </div>
      <div className={`font-display italic font-black text-3xl ${valueColor} leading-none`}>
        {value}
      </div>
      {hint && (
        <div className="text-sandstone text-xs mt-3">{hint}</div>
      )}
    </div>
  );
}
