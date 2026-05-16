import type { Metadata } from 'next';
import BlogShell from '@/components/sections/geo/BlogShell';
import { articleSchema, JsonLd } from '@/lib/schema/geo-page-schemas';

const SLUG = '/blog/princeton-studie-male-firmy-v-ai-vyhledavani';
const TITLE = 'Princeton dokázal, že malé firmy předhánějí korporáty. Tady jsou data.';
const EXCERPT =
  'Polo-technický rozbor peer-reviewed studie z roku 2024: výzkumníci z Princetonu, Georgia Tech a Allen Institute of AI otestovali 10 000 dotazů napříč obory. Výsledek: malé weby zaznamenaly 115 % nárůst viditelnosti v AI odpovědích. Co to konkrétně znamená pro českou SMB firmu.';
const PUBLISHED = '2026-05-12';

export const metadata: Metadata = {
  title: TITLE,
  description: EXCERPT,
  alternates: { canonical: SLUG },
  openGraph: { title: TITLE, description: EXCERPT, url: SLUG, type: 'article', locale: 'cs_CZ' },
};

export default function Article2() {
  return (
    <>
      <JsonLd
        data={articleSchema({
          title: TITLE,
          description: EXCERPT,
          slug: SLUG,
          datePublished: PUBLISHED,
        })}
      />
      <BlogShell
        tag="DATA & DŮKAZY"
        title={TITLE}
        excerpt={EXCERPT}
        readTime="12 min čtení"
        published="12. května 2026"
        comingSoon
      >
        <h2 className="font-display font-bold text-3xl text-moonlight">Studie, kterou v ČR nikdo nečetl</h2>
        <p>
          V listopadu 2023 publikoval tým výzkumníků z Princeton University, Georgia Tech a Allen Institute of AI
          paper s názvem <em>„GEO: Generative Engine Optimization&ldquo;</em>. Studie prošla recenzním řízením a v
          roce 2024 byla prezentována na konferenci ACM KDD — jedné z nejprestižnějších v oboru data miningu.
        </p>
        <p>
          To je ten typ akademického důkazu, který v marketingovém světě prakticky nikdy nedostanete. A v české
          marketingové komunitě o ní téměř nikdo neslyšel.
        </p>

        <h2 className="font-display font-bold text-3xl text-moonlight mt-12">Co přesně testovali</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>10 000 reálných dotazů napříč 9 obory (finance, zdraví, technologie, právo, vzdělávání…)</li>
          <li>Generativní AI vyhledávače: GPT-3.5/4, Perplexity-style systémy</li>
          <li>9 různých technik optimalizace obsahu</li>
          <li>Měření: zda a kolikrát byl konkrétní zdroj citován v AI odpovědi</li>
        </ul>

        <h2 className="font-display font-bold text-3xl text-moonlight mt-12">Hlavní zjištění</h2>
        <p>
          Tři techniky měly statisticky průkazný efekt na to, zda AI cituje konkrétní stránku jako zdroj:
        </p>
        <ol className="list-decimal pl-6 space-y-3">
          <li>
            <strong className="text-moonlight">Citace zdrojů a statistik v textu</strong> — +30–40 % viditelnost
          </li>
          <li>
            <strong className="text-moonlight">Strukturovaná data (schema markup, FAQ formát)</strong> — +25 %
            viditelnost
          </li>
          <li>
            <strong className="text-moonlight">Question-based H2/H3 nadpisy</strong> — +20 % viditelnost
          </li>
        </ol>

        <h2 className="font-display font-bold text-3xl text-moonlight mt-12">Demokratizační efekt</h2>
        <p>
          Nejdůležitější zjištění pro českou SMB firmu: efekt byl{' '}
          <strong className="text-moonlight">největší u menších, nedominantních webů</strong>.
        </p>
        <blockquote className="border-l-2 border-caramel pl-6 italic text-moonlight">
          „Lower-ranked pages benefit most from GEO optimization, seeing 115% visibility improvement, while
          position-1 pages saw little change.&ldquo;
          <footer className="font-mono text-xs uppercase tracking-widest text-sandstone mt-2 not-italic">
            Aggarwal et al., ACM KDD 2024
          </footer>
        </blockquote>
        <p>
          V překladu: pokud jste v Googlu na první stránce, GEO Vám už moc nepřidá. Pokud jste na 6.–10. místě nebo
          dál, můžete v AI vyhledávání skokově vyletět.
        </p>

        <h2 className="font-display font-bold text-3xl text-moonlight mt-12">Co to znamená v korunách</h2>
        <p>
          Tahle studie je v podstatě akademický manuál pro to, co prodáváme jako GEO službu. Není to spekulace nebo
          marketingový buzzword — je to měřitelně ověřená disciplína s konkrétními technikami a konkrétními
          efekty.
        </p>
        <p>
          A protože v ČR ji nikdo z větších agentur zatím systematicky nedělá, je to první rok, kde malá firma s
          rozpočtem 6 000 Kč/měs může reálně přebít korporát s 500 000 Kč rozpočtem na klasické SEO.
        </p>

        <p className="text-caramel-light italic">
          Tenhle článek bude do konce května 2026 rozšířen o překlad konkrétních technik do české praxe, příklady
          z reálných auditů a šablonu pro vlastní analýzu. Pokud chcete vědět hned, jak Vy stojíte — mini-audit
          zdarma.
        </p>
      </BlogShell>
    </>
  );
}
