"use client";

import DetectiveTag from "@/components/shared/DetectiveTag";
import RevealOnScroll from "@/components/shared/RevealOnScroll";
import { Fingerprint } from "lucide-react";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import Link from "next/link";

export default function DetectiveEnters() {
  const fingerprintRef = useRef(null);
  const fpInView = useInView(fingerprintRef, { once: true });

  return (
    <section className="bg-parchment text-espresso-text relative overflow-hidden paper-texture">
      <div className="max-w-7xl mx-auto px-6 md:px-12 py-24 md:py-32 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        <div className="lg:col-span-7">
          <RevealOnScroll>
            <DetectiveTag variant="light" className="mb-6">DETEKTIV VSTUPUJE</DetectiveTag>

            <h2 className="font-display font-black text-espresso-text text-4xl md:text-6xl leading-[1.05] mb-10">
              Něco mezi dev studiem, strategickou kanceláří a detektivní agenturou.
            </h2>
          </RevealOnScroll>

          <RevealOnScroll delay={0.15}>
            <div className="space-y-6 text-base md:text-lg text-brown-muted leading-relaxed max-w-2xl">
              <p>
                Vyšetřujeme, co je s Vaším digitálním podnikáním špatně. Někdy je to web. Někdy je to marketing. Někdy je to business model. Vždy začínáme tím, že najdeme příčinu — ne jen symptom.
              </p>
              <p>
                Pak to opravujeme. Žádné šablony. Žádné prázdné sliby. Žádné AI slop weby. Jen řešení, která fungují — a klient, který si je může spravovat sám.
              </p>
            </div>

            <Link
              href="/manifest"
              className="inline-flex items-center gap-2 mt-10 font-mono text-xs uppercase tracking-widest text-espresso-text border-b border-espresso-text/30 pb-1 hover:border-espresso-text transition-all"
            >
              Přečíst celý manifest →
            </Link>
          </RevealOnScroll>
        </div>

        <div className="lg:col-span-5 flex flex-col items-center lg:items-end gap-8">
          <motion.div
            ref={fingerprintRef}
            className="w-32 h-32 rounded-full bg-espresso-text/5 border border-espresso-text/10 flex items-center justify-center"
            initial={{ scale: 0, rotate: -180 }}
            animate={fpInView ? { scale: 1, rotate: 0 } : { scale: 0, rotate: -180 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          >
            <Fingerprint size={64} className="text-espresso-text/60" strokeWidth={1} />
          </motion.div>
          <RevealOnScroll delay={0.3}>
            <div className="text-center lg:text-right">
              <p className="font-mono text-[10px] uppercase tracking-widest text-espresso-text mb-1">
                Otisk ARBIQ
              </p>
              <p className="text-sm text-brown-muted">
                Garantovaná preciznost.
              </p>
            </div>
          </RevealOnScroll>
          <motion.div
            initial={{ scale: 0, rotate: -20 }}
            animate={fpInView ? { scale: 1, rotate: -6 } : { scale: 0, rotate: -20 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay: 0.5 }}
            className="border-2 border-rust text-rust px-4 py-2 font-mono text-xs uppercase tracking-widest -rotate-6 mt-4"
          >
            PŘÍPAD OVĚŘEN — 2026
          </motion.div>
        </div>
      </div>
    </section>
  );
}
