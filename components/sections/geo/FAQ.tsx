'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import DetectiveTag from '@/components/shared/DetectiveTag';
import { geoFaqs } from '@/lib/geo/faqs';

export default function FAQ() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section className="py-24 md:py-32 bg-coffee">
      <div className="max-w-3xl mx-auto px-6 md:px-12">
        <DetectiveTag className="mb-4">VÝSLECH</DetectiveTag>
        <h2 className="font-display font-black text-moonlight text-4xl md:text-5xl mb-12">
          Časté otázky
        </h2>
        <div className="space-y-2">
          {geoFaqs.map((faq, i) => {
            const isOpen = open === i;
            return (
              <motion.div
                key={faq.q}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: 0.4, delay: Math.min(i * 0.03, 0.3) }}
                className={`border transition-colors ${
                  isOpen ? 'border-caramel/60 bg-caramel/[0.03]' : 'border-tobacco'
                }`}
              >
                <button
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="w-full flex justify-between items-center p-6 text-left hover:bg-caramel/5 transition-colors"
                  aria-expanded={isOpen}
                >
                  <span className="text-moonlight font-medium pr-4">{faq.q}</span>
                  <motion.div
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.25, ease: 'easeOut' }}
                    className="shrink-0"
                  >
                    <ChevronDown size={18} className="text-caramel" />
                  </motion.div>
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      key="content"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                      className="overflow-hidden"
                    >
                      <div className="px-6 pb-6 text-sepia/80 text-sm leading-relaxed border-t border-tobacco pt-4">
                        {faq.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
