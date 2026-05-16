import DetectiveTag from '@/components/shared/DetectiveTag';

const aiPlatforms = [
  { name: 'ChatGPT', note: '800M uživatelů týdně, OpenAI' },
  { name: 'Google AI Overviews', note: 'Generativní odpovědi nad výsledky Google' },
  { name: 'Perplexity', note: 'AI vyhledávač s citacemi, růst 500 % ročně' },
  { name: 'Gemini', note: 'Google AI, integrované do vyhledávání a Workspace' },
  { name: 'Claude', note: 'Anthropic, často používán profesionály' },
  { name: 'Microsoft Copilot', note: 'AI v Bing, Edge a Windows' },
];

export default function WhatIsGeo() {
  return (
    <section id="co-je-geo" className="py-24 md:py-32 bg-coffee scroll-mt-32 md:scroll-mt-44">
      <div className="max-w-5xl mx-auto px-6 md:px-12">
        <DetectiveTag className="mb-4">EDUKACE — ZÁKLAD</DetectiveTag>
        <h2 className="font-display font-black text-moonlight text-4xl md:text-5xl mb-4">
          Co je GEO a proč o něm slyšíte poprvé
        </h2>
        <p className="text-sepia/80 text-base leading-relaxed max-w-3xl mb-16">
          GEO (Generative Engine Optimization) je disciplína, která se stará o to, aby AI vyhledávače jako ChatGPT, Gemini nebo Perplexity citovaly Vaši firmu, když se jich někdo zeptá na otázku z Vašeho oboru.
        </p>

        {/* Blok 1 */}
        <div className="mb-20">
          <span className="font-mono text-[10px] uppercase tracking-widest text-caramel block mb-4">
            BLOK 01 — POSUN V CHOVÁNÍ
          </span>
          <h3 className="font-display font-bold text-2xl md:text-3xl text-moonlight mb-6">
            Lidé už nehledají tak, jak hledávali
          </h3>
          <div className="text-sepia/85 leading-relaxed space-y-4 max-w-3xl">
            <p>
              Před pěti lety jste otevřel{' '}Google, napsal{' '}„finanční poradce Praha&ldquo;, proklikal se na tři weby a podle dojmu vybral.
            </p>
            <p>
              Dnes otevřete ChatGPT, zeptáte se: <em className="text-moonlight">„Koho si vybrat na řešení penzijka, když jsem OSVČ?&ldquo;</em> — a dostanete tři jména s odůvodněním. Nikdo nehledá. Všichni se ptají.
            </p>
            <p className="text-caramel-light font-medium">
              A Vy v té odpovědi buď jste, nebo neexistujete.
            </p>
          </div>
        </div>

        {/* Blok 2 — tabulka SEO vs GEO */}
        <div className="mb-20">
          <span className="font-mono text-[10px] uppercase tracking-widest text-caramel block mb-4">
            BLOK 02 — SROVNÁNÍ
          </span>
          <h3 className="font-display font-bold text-2xl md:text-3xl text-moonlight mb-8">
            SEO vs. GEO — v čem je rozdíl
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-tobacco border border-tobacco">
            <div className="bg-espresso p-6 md:p-8">
              <div className="font-mono text-[10px] uppercase tracking-widest text-sandstone mb-3">
                KLASICKÉ SEO
              </div>
              <ul className="space-y-3 text-sepia/85 text-sm leading-relaxed">
                <li>Cíl: být v top&nbsp;10 odkazů na Googlu</li>
                <li>Algoritmus hodnotí zpětné odkazy a stáří domény</li>
                <li>Vyhrávají velké brandy s milionovými rozpočty</li>
                <li>5+ let na výsledky pro nové weby</li>
                <li>Klient klikne na Váš web</li>
              </ul>
            </div>
            <div className="bg-espresso p-6 md:p-8 border-l-0 md:border-l border-caramel/30">
              <div className="font-mono text-[10px] uppercase tracking-widest text-caramel mb-3">
                GEO — AI VIDITELNOST
              </div>
              <ul className="space-y-3 text-moonlight text-sm leading-relaxed">
                <li>Cíl: být v odpovědi, kterou AI napíše</li>
                <li>AI hodnotí kvalitu odpovědi a strukturu obsahu</li>
                <li>Vyhrávají firmy s nejlepší odpovědí, ne s největším rozpočtem</li>
                <li>3–9 měsíců na první výsledky</li>
                <li>Klient dostane odpověď s Vaším jménem</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Blok 3 — platformy */}
        <div>
          <span className="font-mono text-[10px] uppercase tracking-widest text-caramel block mb-4">
            BLOK 03 — KTERÉ AI ŘEŠÍME
          </span>
          <h3 className="font-display font-bold text-2xl md:text-3xl text-moonlight mb-8">
            Šest platforem, kde Vaši zákazníci hledají
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {aiPlatforms.map((p) => (
              <div key={p.name} className="bg-espresso border border-tobacco p-5">
                <div className="font-display font-bold text-lg text-moonlight mb-1">{p.name}</div>
                <p className="text-sandstone text-xs leading-relaxed">{p.note}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
