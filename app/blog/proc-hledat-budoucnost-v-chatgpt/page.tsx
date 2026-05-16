import type { Metadata } from 'next';
import BlogShell from '@/components/sections/geo/BlogShell';
import { articleSchema, JsonLd } from '@/lib/schema/geo-page-schemas';

const SLUG = '/blog/proc-hledat-budoucnost-v-chatgpt';
const TITLE = 'Proč hledá Vaše budoucnost v ChatGPT, ne v Googlu';
const EXCERPT =
  'Edukační průvodce pro úplné laiky. Co se mění v chování zákazníků, proč klasické Google vyhledávání nestačí a kdo si nás vybírá v nové éře. Krátký příběh o tom, jak za posledních 18 měsíců zmizel způsob, kterým jsme všichni do té doby hledali.';
const PUBLISHED = '2026-05-12';

export const metadata: Metadata = {
  title: TITLE,
  description: EXCERPT,
  alternates: { canonical: SLUG },
  openGraph: { title: TITLE, description: EXCERPT, url: SLUG, type: 'article', locale: 'cs_CZ' },
};

export default function Article1() {
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
        tag="ÚVOD DO TÉMATU"
        title={TITLE}
        excerpt={EXCERPT}
        readTime="8 min čtení"
        published="12. května 2026"
        comingSoon
      >
        <h2 className="font-display font-bold text-3xl text-moonlight">Příběh, který se Vám stane do dvou let</h2>
        <p>
          Představte si situaci, která se odehrála minulý měsíc v jedné pražské účetní kanceláři. Klient — majitel
          stavební firmy, padesát zaměstnanců — přijde na konzultaci a řekne: <em className="text-moonlight">„Doporučil mi Vás ChatGPT.&ldquo;</em>
        </p>
        <p>
          Účetní zamrkla. Pak se zasmála. Pak jí to nedalo a otevřela ChatGPT, napsala přesně to, na co se klient
          podle vlastních slov ptal — a opravdu tam byla. Jméno firmy, dvě věty proč. Vedle dvou konkurentů.
        </p>
        <p>
          Nikdy v životě neoptimalizovala web. Nikdy nedělala SEO. Měla jen pět let starý WordPress a sem tam blog
          o daních, který psala pro klienty. A přesto ji AI doporučila.
        </p>

        <h2 className="font-display font-bold text-3xl text-moonlight mt-12">Co se za posledních 18 měsíců změnilo</h2>
        <p>
          Před pěti lety jste otevřel{' '}Google, napsal{' '}„finanční poradce Praha&ldquo;, proklikal se na tři weby a podle dojmu vybral. Dnes otevřete ChatGPT a zeptáte se: <em className="text-moonlight">„Koho si vybrat na řešení penzijka, když jsem OSVČ?&ldquo;</em> Dostanete tři jména s odůvodněním. Žádné klikání.
        </p>
        <p>
          Tenhle posun se mezi roky 2024 a 2026 stal nejrychlejší změnou chování spotřebitelů od příchodu mobilního
          internetu. A většina českých firem ho přespala.
        </p>

        <h2 className="font-display font-bold text-3xl text-moonlight mt-12">Čísla, která to potvrzují</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>800 milionů uživatelů ChatGPT týdně (OpenAI, listopad 2025)</li>
          <li>25 % všech Google dotazů končí AI odpovědí (Google AI Overviews)</li>
          <li>Návštěvník z AI konvertuje 4× lépe než z klasického vyhledávání</li>
          <li>Růst AI trafficu v ČR: 527 % meziročně</li>
        </ul>

        <h2 className="font-display font-bold text-3xl text-moonlight mt-12">Co to znamená pro Vás</h2>
        <p>
          Pokud máte firmu a Vaši zákazníci pokládají otázky, na které máte odpovědi, jste v dobré pozici — pokud
          tyhle odpovědi máte napsané způsobem, kterému AI rozumí. Pokud ne, jste neviditelní pro skupinu, která už
          dnes zahrnuje 25–40 % Vašich potenciálních klientů (podle demografie a oboru).
        </p>

        <p className="text-caramel-light italic">
          Tenhle článek bude do konce května 2026 rozšířen o konkrétní případy a šablony otázek pro audit. Pokud
          chcete vědět hned, kde Vaše firma v AI vyhledávání stojí — nabízíme mini-audit zdarma.
        </p>
      </BlogShell>
    </>
  );
}
