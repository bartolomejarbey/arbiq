import Link from 'next/link';
import DetectiveTag from '@/components/shared/DetectiveTag';
import { ArrowRight, Clock } from 'lucide-react';

export const blogPosts = [
  {
    slug: 'proc-hledat-budoucnost-v-chatgpt',
    title: 'Proč hledá Vaše budoucnost v ChatGPT, ne v Googlu',
    excerpt:
      'Edukační průvodce pro úplné laiky. Co se mění v chování zákazníků, proč klasické Google vyhledávání nestačí a kdo si nás vybírá v nové éře.',
    readTime: '8 min čtení',
    tag: 'ÚVOD DO TÉMATU',
  },
  {
    slug: 'princeton-studie-male-firmy-v-ai-vyhledavani',
    title: 'Princeton dokázal, že malé firmy předhánějí korporáty. Tady jsou data.',
    excerpt:
      'Polo-technický rozbor akademické studie z roku 2024: 10 000 dotazů, 115 % nárůst viditelnosti pro menší weby. Co to konkrétně znamená pro českou SMB firmu.',
    readTime: '12 min čtení',
    tag: 'DATA &amp; DŮKAZY',
  },
  {
    slug: 'jak-zjistit-zda-vas-chatgpt-doporucuje',
    title: 'Jak za 90 dní zjistíte, zda Vás ChatGPT doporučuje',
    excerpt:
      'Praktický DIY návod krok za krokem. 30 dotazů, 5 platforem, šablona pro report. Po jeho prostudování budete vědět, kde stojíte — a jestli to chcete řešit sami nebo s námi.',
    readTime: '18 min čtení',
    tag: 'PRAKTICKÝ NÁVOD',
  },
];

export default function BlogPreview() {
  return (
    <section id="blog" className="py-24 md:py-32 bg-espresso scroll-mt-32 md:scroll-mt-44">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <DetectiveTag className="mb-4">SPISY K NASTUDOVÁNÍ</DetectiveTag>
        <h2 className="font-display font-black text-moonlight text-4xl md:text-5xl mb-4">
          Tři články, než se rozhodnete
        </h2>
        <p className="text-sepia/80 text-base leading-relaxed max-w-3xl mb-16">
          Tohle si přečtěte dřív, než nám napíšete. Pochopíte rámec, uvidíte data, a budete vědět, jaké otázky se nás máte ptát.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {blogPosts.map((post) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="group bg-coffee border border-tobacco p-8 flex flex-col hover:border-caramel/40 transition-all"
            >
              <div className="font-mono text-[10px] uppercase tracking-widest text-caramel mb-4">
                {post.tag}
              </div>
              <h3 className="font-display font-bold text-xl text-moonlight mb-4 leading-snug group-hover:text-caramel-light transition-colors">
                {post.title}
              </h3>
              <p className="text-sepia/80 text-sm leading-relaxed mb-6 flex-1">{post.excerpt}</p>
              <div className="flex items-center justify-between pt-6 border-t border-tobacco">
                <span className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-sandstone">
                  <Clock size={12} /> {post.readTime}
                </span>
                <span className="text-caramel inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-widest group-hover:gap-2 transition-all">
                  Číst <ArrowRight size={12} />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
