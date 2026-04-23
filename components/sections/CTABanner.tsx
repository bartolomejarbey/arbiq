"use client";

import Link from "next/link";
import DetectiveTag from "@/components/shared/DetectiveTag";
import RevealOnScroll from "@/components/shared/RevealOnScroll";

export default function CTABanner() {
  return (
    <section className="py-32 md:py-40 px-6 md:px-12 relative overflow-hidden text-center">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(201,152,106,0.15),transparent_70%)]"></div>
      <div className="relative z-10 max-w-4xl mx-auto">
        <RevealOnScroll>
          <DetectiveTag className="mb-8">PŘÍPAD ČEKÁ</DetectiveTag>
          <h2 className="font-display font-black text-moonlight text-5xl md:text-7xl lg:text-8xl leading-[0.95] mb-10">
            Máte případ pro nás?
          </h2>
        </RevealOnScroll>
        <RevealOnScroll delay={0.15}>
          <p className="text-lg md:text-xl text-sepia max-w-2xl mx-auto mb-12 leading-relaxed">
            Začněte Rentgenem. 1 hodina, 0 rizika, 100 % upřímnost.
          </p>
          <div className="flex flex-col md:flex-row gap-4 justify-center items-center">
            <Link
              href="/rentgen"
              className="bg-caramel text-espresso px-10 py-5 font-mono text-xs uppercase tracking-widest font-bold hover:bg-caramel-light hover:shadow-[0_0_40px_rgba(201,152,106,0.3)] transition-all shadow-2xl"
            >
              Objednat Rentgen
            </Link>
            <a
              href="tel:+420725932729"
              className="border border-caramel text-caramel px-10 py-5 font-mono text-xs uppercase tracking-widest hover:bg-caramel/10 transition-all"
            >
              Zavolat nám
            </a>
          </div>
        </RevealOnScroll>
      </div>
    </section>
  );
}
