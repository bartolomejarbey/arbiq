'use client';

import type { ReactNode } from 'react';
import { motion } from 'framer-motion';

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
    <motion.div
      className="bg-coffee p-6 hover:bg-tobacco/30 transition-colors"
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      <div className="font-mono text-[10px] uppercase tracking-widest text-sandstone mb-3">
        {label}
      </div>
      <div className={`font-display italic font-black text-3xl ${valueColor} leading-none`}>
        {value}
      </div>
      {hint && (
        <div className="text-sandstone text-xs mt-3">{hint}</div>
      )}
    </motion.div>
  );
}
