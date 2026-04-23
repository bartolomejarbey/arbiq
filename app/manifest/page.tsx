import DetectiveTag from "@/components/shared/DetectiveTag";
import WaxSeal from "@/components/shared/WaxSeal";

export default function ManifestPage() {
  return (
    <div className="pt-32 pb-24">
      <section className="bg-parchment text-espresso-text paper-texture py-24 md:py-32">
        <div className="max-w-3xl mx-auto px-6 md:px-12">
          <div className="text-center mb-16">
            <DetectiveTag variant="light" className="mb-6">DOKUMENT Č. 001</DetectiveTag>
            <h1 className="font-display font-black text-espresso-text text-5xl md:text-7xl leading-[0.95] mb-4">
              Manifest
            </h1>
            <p className="font-mono text-[10px] uppercase tracking-widest text-brown-muted">
              ARBIQ — PROHLÁŠENÍ O ZÁMĚRU
            </p>
          </div>

          <div className="prose-custom space-y-8 text-lg leading-relaxed text-brown-muted">
            <p>
              <span className="font-display text-6xl float-left mr-4 leading-[0.75] text-espresso-text">V</span>
              zdálili jsme se od podstaty. Digitální svět, který měl podnikatelům pomáhat, se stal labyrintem plným špatných rad, předražených agentur a generovaného odpadu. Weby, které nikdo nečte. Reklamy, které nikdo nekliká. Strategie, které nikoho nezajímají.
            </p>

            <p>
              ARBIQ vznikl, protože jsme toho měli dost. Dost prázdných slibů. Dost reportů bez výsledků. Dost webů, které vypadají jako každý druhý web na internetu. Dost AI slop stránek, které nikdo nekontroluje a nikdo za ně neručí.
            </p>

            <p>
              Věříme, že každý digitální problém má svou příčinu. A každá příčina má řešení. Ale nejdřív ji musíte najít. Proto jsme detektivní agentura — ne v doslovném smyslu, ale v tom nejdůležitějším: hledáme pravdu. Ne tu pohodlnou. Tu skutečnou.
            </p>

            <p>
              Naše pravidla jsou jednoduchá. Nebereme případ, kterému nevěříme. Neslibujeme, co nemůžeme splnit. Nestavíme weby, za které bychom se styděli. A nikdy, nikdy neříkáme klientovi to, co chce slyšet, místo toho, co potřebuje vědět.
            </p>

            <p>
              Pracujeme jinak. Jeden detektiv, jeden případ, jeden výsledek. Žádné týmy po deseti lidech, kde nikdo neví, kdo za co zodpovídá. Žádné měsíční reporty plné grafů, které zakrývají, že se nic neděje. Žádné závislosti — každý web předáváme tak, aby si ho klient mohl spravovat sám.
            </p>

            <p>
              Naše nástroje jsou nabroušeny pro český trh. Webiq, Finatiq, Pamatiq, Reklamiq — každý řeší konkrétní problém, který potkáváme u každého druhého klienta. Nejsou to hračky. Jsou to zbraně pro podnikatele, kteří chtějí růst.
            </p>

            <p>
              ARBIQ vyšetřuje a opravuje. Web. Marketing. Aplikace na míru. Jeden rys, jeden cíl: aby Váš business fungoval.
            </p>

            <p>
              Tohle je náš manifest. Pokud Vás oslovuje, máte případ pro nás.
            </p>
          </div>

          <div className="mt-20 pt-12 border-t border-brown-muted/20 flex flex-col md:flex-row justify-between items-center gap-8">
            <div>
              <p className="font-display text-2xl text-espresso-text mb-1">B. Rota</p>
              <p className="font-mono text-[10px] uppercase tracking-widest text-brown-muted">
                Zakladatel ARBIQ • Praha, duben 2026
              </p>
            </div>
            <WaxSeal text="STVRZENO" subtext="DUBEN 2026" />
          </div>
        </div>
      </section>
    </div>
  );
}
