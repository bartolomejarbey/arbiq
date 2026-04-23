"use client";

import DetectiveTag from "@/components/shared/DetectiveTag";
import RevealOnScroll from "@/components/shared/RevealOnScroll";
import StaggerGrid from "@/components/shared/StaggerGrid";
import { Globe, Target, Building2, Code2, Zap, Search, ArrowRight } from "lucide-react";
import Link from "next/link";

const services = [
  {
    icon: Globe,
    name: "Webové stránky",
    description: "Weby, které nevypadají jako weby od umělé inteligence, opravdu prodávají a Vy si je můžete sami upravovat.",
    href: "/sluzby/webove-stranky",
  },
  {
    icon: Target,
    name: "Získat zakázky",
    description: "PPC, SEO, Meta Ads, e-mailing. Přivedeme Vám zákazníky a naučíme Váš web je nepustit.",
    href: "/sluzby/ziskat-zakazky",
  },
  {
    icon: Building2,
    name: "Pro firmy",
    description: "Strategická konzultace, audit, dlouhodobé partnerství. Přizpůsobíme se Vašemu rozpočtu i ambicím.",
    href: "/sluzby/firma",
  },
  {
    icon: Code2,
    name: "Systémy na míru",
    description: "Webové aplikace, SaaS, CRM, klientské zóny. Žádné hotové řešení — jen to, co potřebujete.",
    href: "/sluzby/systemy-na-miru",
  },
  {
    icon: Zap,
    name: "Automatizace firem",
    description: "Ušetříme Vám hodiny práce týdně. Ne přelepenými šablonami, ale automatizacemi na míru Vašemu provozu.",
    href: "/sluzby/automatizace",
  },
  {
    icon: Search,
    name: "SEO",
    description: "Web bez SEO je dopis bez adresy. Děláme Váš web dohledatelný. Poctivě, bez černých technik.",
    href: "/sluzby/seo",
  },
];

export default function ServicesGrid() {
  return (
    <section className="py-32 bg-coffee">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <RevealOnScroll>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-20 gap-8">
            <div>
              <DetectiveTag className="mb-4">DETEKTIVOVY NÁSTROJE</DetectiveTag>
              <h2 className="font-display font-black text-moonlight text-4xl md:text-6xl">
                Jeden detektiv. Šest specializací.
              </h2>
            </div>
            <p className="text-sepia/60 max-w-xs text-sm">
              Vyberte si, s čím Vám můžeme pomoct.
            </p>
          </div>
        </RevealOnScroll>

        <StaggerGrid className="grid grid-cols-1 md:grid-cols-3 gap-6" staggerDelay={0.08}>
          {services.map((s) => (
            <ServiceCard key={s.href} {...s} />
          ))}
        </StaggerGrid>
      </div>
    </section>
  );
}

function ServiceCard({
  icon: Icon,
  name,
  description,
  href,
}: (typeof services)[number]) {
  return (
    <Link
      href={href}
      className="group bg-espresso border border-tobacco p-8 hover:border-caramel hover:bg-tobacco/30 hover:shadow-[0_0_40px_rgba(201,152,106,0.15)] hover:-translate-y-2 transition-all duration-300 flex flex-col"
    >
      <Icon size={36} className="text-caramel mb-6 group-hover:scale-110 transition-transform duration-300" strokeWidth={1.5} />
      <h3 className="font-display font-bold text-2xl text-moonlight mb-3 group-hover:text-caramel transition-colors">
        {name}
      </h3>
      <p className="text-sm text-sepia/80 leading-relaxed mb-6 flex-1">
        {description}
      </p>
      <span className="font-mono text-sm uppercase tracking-wider text-caramel font-bold inline-flex items-center gap-2 group-hover:gap-3 transition-all">
        Detail <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
      </span>
    </Link>
  );
}
