"use client";

import Image from "next/image";
import DetectiveTag from "@/components/shared/DetectiveTag";
import RevealOnScroll from "@/components/shared/RevealOnScroll";
import StaggerGrid from "@/components/shared/StaggerGrid";
import Link from "next/link";
import { ArrowRight, ExternalLink } from "lucide-react";

const cases = [
  {
    number: "#001",
    domain: "xth.cz",
    url: "https://xth.cz",
    screenshot: "/ilustrace/references/xth.png",
    summary: "Property management. 7 stránek, multi-jazyk CZ/EN/RU, investiční kalkulačka, garance nájemného.",
    tags: ["WEBDESIGN", "MULTI-LANG", "WORDPRESS"],
    rotation: "rotate-[1deg]",
  },
  {
    number: "#002",
    domain: "fachmani.org",
    url: "https://fachmani.org",
    screenshot: "/ilustrace/references/fachmani.png",
    summary: "Marketplace pro řemeslníky. Next.js, Supabase, Vercel. Registrace, profily, ARES API, mobilní aplikace v přípravě.",
    tags: ["NEXT.JS", "SUPABASE", "MARKETPLACE"],
    rotation: "-rotate-[1deg]",
  },
  {
    number: "#003",
    domain: "aurahomes.cz",
    url: "https://aurahomes.cz",
    screenshot: "/ilustrace/references/aurahomes.png",
    summary: "Web developerské firmy. Klidná typografie, prezentace projektů, kontaktní flow pro investory.",
    tags: ["WEBDESIGN", "DEVELOPER", "PREMIUM"],
    rotation: "rotate-[2deg]",
  },
];

export default function SolvedCases() {
  return (
    <section className="py-32 bg-coffee">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <RevealOnScroll>
          <div className="mb-20">
            <DetectiveTag className="mb-4">VYŘEŠENÉ PŘÍPADY</DetectiveTag>
            <h2 className="font-display font-black text-moonlight text-4xl md:text-6xl">
              Každý klient je případ.
            </h2>
          </div>
        </RevealOnScroll>

        <StaggerGrid className="grid grid-cols-1 md:grid-cols-3 gap-8" staggerDelay={0.15}>
          {cases.map((c) => (
            <a
              key={c.number}
              href={c.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`block bg-espresso border-l-4 border-caramel ${c.rotation} hover:rotate-0 transition-all duration-500 shadow-xl overflow-hidden group`}
            >
              <div className="relative h-44 border-b border-tobacco overflow-hidden">
                <Image
                  src={c.screenshot}
                  alt={`Náhled ${c.domain}`}
                  fill
                  sizes="(min-width: 768px) 33vw, 100vw"
                  className="object-cover object-top group-hover:scale-105 transition-transform duration-700"
                />
              </div>
              <div className="p-8">
                <span className="font-mono text-[10px] uppercase tracking-widest text-caramel block mb-3">
                  CASE FILE {c.number}
                </span>
                <h3 className="text-2xl font-display font-black text-moonlight mb-1 group-hover:text-caramel transition-colors">
                  {c.domain}
                </h3>
                <p className="text-sepia/70 text-sm leading-relaxed mt-4 mb-6">
                  {c.summary}
                </p>
                <div className="flex flex-wrap gap-2 mb-6">
                  {c.tags.map((t) => (
                    <span key={t} className="bg-coffee px-2 py-1 font-mono text-[9px] text-sandstone tracking-wider">
                      {t}
                    </span>
                  ))}
                </div>
                <div className="flex justify-between items-center pt-4 border-t border-tobacco">
                  <span className="font-mono text-[9px] uppercase tracking-widest text-olive">
                    STATUS: VYŘEŠEN
                  </span>
                  <ExternalLink size={14} className="text-caramel group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </a>
          ))}
        </StaggerGrid>

        <RevealOnScroll delay={0.4} className="text-center mt-16">
          <Link
            href="/pripady"
            className="inline-flex items-center gap-2 border border-caramel text-caramel px-8 py-4 font-mono text-xs uppercase tracking-widest hover:bg-caramel/10 transition-all"
          >
            Prohlédnout všechny případy <ArrowRight size={14} />
          </Link>
        </RevealOnScroll>
      </div>
    </section>
  );
}
