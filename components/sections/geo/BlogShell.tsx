import Link from 'next/link';
import DetectiveTag from '@/components/shared/DetectiveTag';
import { ArrowLeft, Clock, Calendar, User } from 'lucide-react';

interface BlogShellProps {
  tag: string;
  title: string;
  excerpt: string;
  readTime: string;
  published: string;
  author?: string;
  comingSoon?: boolean;
  children: React.ReactNode;
}

export default function BlogShell({
  tag,
  title,
  excerpt,
  readTime,
  published,
  author = 'Bartoloměj Rota',
  comingSoon = false,
  children,
}: BlogShellProps) {
  return (
    <article className="pt-32 pb-32">
      {/* Hero / hlavička článku */}
      <header className="px-6 md:px-12 mb-16">
        <div className="max-w-3xl mx-auto">
          <Link
            href="/sluzby/geo-ai-viditelnost"
            className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest text-sandstone hover:text-caramel transition-colors mb-12"
          >
            <ArrowLeft size={14} /> Zpět na GEO službu
          </Link>

          <DetectiveTag className="mb-6">{tag}</DetectiveTag>

          <h1 className="font-display font-black text-moonlight text-4xl md:text-6xl leading-[1.05] mb-8">
            {title}
          </h1>

          <p className="text-xl text-sepia/85 leading-relaxed mb-10">{excerpt}</p>

          <div className="flex flex-wrap items-center gap-6 font-mono text-[11px] uppercase tracking-widest text-sandstone pb-8 border-b border-tobacco">
            <span className="flex items-center gap-2">
              <User size={12} /> {author}
            </span>
            <span className="flex items-center gap-2">
              <Calendar size={12} /> {published}
            </span>
            <span className="flex items-center gap-2">
              <Clock size={12} /> {readTime}
            </span>
            {comingSoon && (
              <span className="text-rust border border-rust/40 px-3 py-1">Brzy rozšířeno</span>
            )}
          </div>
        </div>
      </header>

      {/* Tělo článku */}
      <div className="px-6 md:px-12">
        <div className="max-w-3xl mx-auto prose-arbiq text-sepia/85 leading-relaxed text-base md:text-lg space-y-6">
          {children}
        </div>
      </div>

      {/* Footer — CTA zpět do služby */}
      <footer className="mt-24 px-6 md:px-12">
        <div className="max-w-3xl mx-auto bg-coffee border border-caramel/30 p-8 md:p-10">
          <h2 className="font-display font-bold text-2xl md:text-3xl text-moonlight mb-4">
            Chcete tohle pro svou firmu?
          </h2>
          <p className="text-sepia/85 leading-relaxed mb-6">
            Zdarma Vám položíme pět otázek z Vašeho oboru do ChatGPT a Perplexity. Uvidíte přesně, kde stojíte — a jestli má smysl tohle řešit.
          </p>
          <Link
            href="/sluzby/geo-ai-viditelnost#audit-zdarma"
            className="inline-flex items-center gap-2 bg-caramel text-espresso px-6 py-3 font-mono text-xs uppercase tracking-widest font-bold hover:bg-caramel-light transition-all"
          >
            Vyšetříme Váš případ zdarma →
          </Link>
        </div>
      </footer>
    </article>
  );
}
