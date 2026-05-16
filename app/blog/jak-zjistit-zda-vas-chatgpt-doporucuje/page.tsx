import type { Metadata } from 'next';
import BlogShell from '@/components/sections/geo/BlogShell';
import { articleSchema, JsonLd } from '@/lib/schema/geo-page-schemas';

const SLUG = '/blog/jak-zjistit-zda-vas-chatgpt-doporucuje';
const TITLE = 'Jak za 90 dní zjistíte, zda Vás ChatGPT doporučuje';
const EXCERPT =
  'Praktický DIY návod krok za krokem. 30 dotazů, 5 platforem, šablona pro report. Po jeho prostudování budete vědět, kde stojíte v AI vyhledávání — a jestli to chcete řešit sami, nebo s námi. Bez nutnosti utratit korunu.';
const PUBLISHED = '2026-05-12';

export const metadata: Metadata = {
  title: TITLE,
  description: EXCERPT,
  alternates: { canonical: SLUG },
  openGraph: { title: TITLE, description: EXCERPT, url: SLUG, type: 'article', locale: 'cs_CZ' },
};

export default function Article3() {
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
        tag="PRAKTICKÝ NÁVOD"
        title={TITLE}
        excerpt={EXCERPT}
        readTime="18 min čtení"
        published="12. května 2026"
        comingSoon
      >
        <h2 className="font-display font-bold text-3xl text-moonlight">Než začnete: co budete potřebovat</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>Účet v ChatGPT (zdarma stačí), Perplexity (zdarma), Gemini (zdarma)</li>
          <li>2 hodiny soustředěné práce</li>
          <li>Tabulku v Excelu nebo Google Sheets (šablonu si stáhnete níže — bude doplněno)</li>
          <li>Notepad pro výpisky</li>
        </ul>

        <h2 className="font-display font-bold text-3xl text-moonlight mt-12">Krok 1 — Sestavte 30 reálných otázek (60 minut)</h2>
        <p>
          Tohle je nejdůležitější krok celého auditu. Špatné otázky = zbytečný audit. Otázky musí být takové, jaké
          by Vaši zákazníci skutečně položili AI — ne klíčová slova z Google Ads.
        </p>
        <p>
          <strong className="text-moonlight">Pravidlo:</strong> celá věta v první osobě nebo přirozená otázka.
        </p>
        <ul className="list-disc pl-6 space-y-2">
          <li>❌ „účetní Praha&ldquo;</li>
          <li>✅ „Koho si vybrat na účetnictví pro malou firmu v Praze 4?&ldquo;</li>
          <li>✅ „Jaký mají rozdíl účetní paušál a skutečné výdaje pro OSVČ?&ldquo;</li>
          <li>✅ „Kolik stojí kompletní účetnictví pro eshop s 200 fakturami měsíčně?&ldquo;</li>
        </ul>
        <p>
          Rozdělte 30 otázek do tří kategorií po deseti:
        </p>
        <ol className="list-decimal pl-6 space-y-2">
          <li>
            <strong className="text-moonlight">Komodita</strong> — obecné dotazy z Vašeho oboru („jak vybrat XYZ&ldquo;)
          </li>
          <li>
            <strong className="text-moonlight">Srovnání</strong> — Vy vs. konkurence („XYZ vs. ABC&ldquo;)
          </li>
          <li>
            <strong className="text-moonlight">Doporučení</strong> — kdo, kde („koho si vybrat na XYZ v lokalitě&ldquo;)
          </li>
        </ol>

        <h2 className="font-display font-bold text-3xl text-moonlight mt-12">Krok 2 — Položte je do 5 platforem (45 minut)</h2>
        <p>
          Postupně otevírejte v inkognito okně (důležité — bez Vaší historie a personalizace):
        </p>
        <ul className="list-disc pl-6 space-y-2">
          <li>ChatGPT (chat.openai.com)</li>
          <li>Perplexity (perplexity.ai)</li>
          <li>Google AI Overviews (google.com s aktivovaným AI módem)</li>
          <li>Gemini (gemini.google.com)</li>
          <li>Bing Copilot (bing.com/copilot)</li>
        </ul>
        <p>
          Pro každou otázku zaznamenejte: kdo byl zmíněn, v jakém kontextu, byli jste tam Vy, byla tam konkurence,
          jaké zdroje AI uvedla.
        </p>

        <h2 className="font-display font-bold text-3xl text-moonlight mt-12">Krok 3 — Spočítejte citation share (15 minut)</h2>
        <p>
          Pro každou platformu spočítejte: kolikrát Vás zmínila ze 30 dotazů, kolikrát konkurence, kolikrát nikoho
          z Vás. To je Váš baseline citation share — číslo, které budete dál sledovat.
        </p>

        <h2 className="font-display font-bold text-3xl text-moonlight mt-12">Krok 4 — Interpretace</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>
            <strong className="text-moonlight">0 %:</strong> Pro AI neexistujete. Naléhavý problém pro budoucí roky.
          </li>
          <li>
            <strong className="text-moonlight">1–10 %:</strong> Občas se mihnete. Standard pro neoptimalizovaný web. Velký potenciál růstu.
          </li>
          <li>
            <strong className="text-moonlight">10–30 %:</strong> Slušná pozice. Asi máte kvalitní obsah nebo silný brand. Cílem je udržet a růst.
          </li>
          <li>
            <strong className="text-moonlight">30 %+:</strong> Dominantní v oboru. Hlídejte si to.
          </li>
        </ul>

        <h2 className="font-display font-bold text-3xl text-moonlight mt-12">Krok 5 — Opakujte za 30, 60, 90 dní</h2>
        <p>
          Jeden audit neznamená nic. Hodnota je v trendu. Pokud začnete s 5 % a za 90 dní jste na 15 %, to je
          měřitelný pokrok. Pokud zůstanete na 5 %, něco se musí změnit.
        </p>

        <h2 className="font-display font-bold text-3xl text-moonlight mt-12">Kdy zavolat na agenturu</h2>
        <p>
          Tenhle audit dokáže udělat každý. Ale interpretace, technické nasazení (schema markup, AI crawlery,
          answer capsules) a kontinuální content production — to je už zase práce na měsíce, ne víkend.
        </p>
        <p>
          Po DIY auditu máte tři možnosti: nedělat nic, dělat to sami systematicky (počítejte 8–12 hodin týdně),
          nebo to outsourcovat.
        </p>

        <p className="text-caramel-light italic">
          Tenhle článek bude do konce května 2026 rozšířen o stažitelnou Excel šablonu pro tracking, příklady
          reálných reportů a anonymizované benchmarky podle oboru. Pokud chcete přeskočit DIY a získat
          profesionální audit hned — nabízíme mini-audit zdarma.
        </p>
      </BlogShell>
    </>
  );
}
