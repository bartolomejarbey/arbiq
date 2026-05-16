import DetectiveTag from '@/components/shared/DetectiveTag';
import MarkerUnderline from '@/components/shared/MarkerUnderline';
import RevealOnScroll from '@/components/shared/RevealOnScroll';

export default function Democratization() {
  return (
    <section id="sance" className="py-20 md:py-32 bg-espresso relative overflow-hidden scroll-mt-32 md:scroll-mt-44">
      <div className="max-w-6xl mx-auto px-6 md:px-12">
        <RevealOnScroll>
          <DetectiveTag className="mb-6">VAŠE ŠANCE</DetectiveTag>
          <h2 className="font-display font-black text-moonlight text-3xl md:text-5xl lg:text-6xl leading-[1.05] mb-12 max-w-4xl">
            Proč malé firmy <MarkerUnderline>vyhrávají</MarkerUnderline> v AI vyhledávání
          </h2>
        </RevealOnScroll>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 items-start">
          <RevealOnScroll
            delay={0.1}
            direction="left"
            className="lg:col-span-3"
          >
            <div className="text-sepia/85 leading-relaxed space-y-6 text-base md:text-lg">
              <p>
                V klasickém SEO existují dva typy hráčů. Ty s pětiletým až desetiletým náskokem a milionovými rozpočty na zpětné odkazy — proti nim nemáte šanci. A ty ostatní, co bojují o drobky.
              </p>
              <p>
                <strong className="text-moonlight">AI vyhledávání to ale resetovalo.</strong>{' '}
                ChatGPT neřeší, kolik máte backlinků. Hodnotí, jestli dáváte nejlepší odpověď na konkrétní dotaz. Pokud Vy jako finanční poradce, malíř nebo realitní makléř píšete jasné, strukturované odpovědi pro reálné otázky svých klientů — předehnete v té odpovědi obrovskou firmu, která má na webu jen marketingové slogany.
              </p>
              <p className="text-caramel-light text-lg md:text-2xl font-display italic pt-4">
                To je Vaše šance. A za dvanáct až čtyřiadvacet měsíců se zavře.
              </p>
            </div>
          </RevealOnScroll>

          {/* Vizualizace — dva pruhy */}
          <RevealOnScroll
            delay={0.2}
            direction="right"
            className="lg:col-span-2"
          >
            <div className="space-y-8">
              {/* Klasický Google */}
              <div>
                <div className="font-mono text-[10px] uppercase tracking-widest text-sandstone mb-3">
                  KLASICKÝ GOOGLE
                </div>
                <div className="relative h-12 bg-coffee border border-tobacco">
                  <div className="absolute left-1 top-1 bottom-1 w-3 bg-sandstone/40" title="Malá firma">
                    <span className="sr-only">Malá firma</span>
                  </div>
                  <div className="absolute right-1 top-1 bottom-1 w-1/2 bg-caramel/30 flex items-center justify-center">
                    <span className="font-mono text-[9px] uppercase tracking-widest text-caramel font-bold">
                      Korporát
                    </span>
                  </div>
                </div>
                <p className="font-mono text-[10px] uppercase tracking-widest text-rust/80 mt-3">
                  + 5 LET + MILIONY → KORPORÁT VYHRÁVÁ
                </p>
              </div>

              {/* AI vyhledávání — reset */}
              <div>
                <div className="font-mono text-[10px] uppercase tracking-widest text-caramel mb-3">
                  AI VYHLEDÁVÁNÍ — RESET
                </div>
                <div className="relative h-12 bg-coffee border border-caramel/40">
                  <div className="absolute inset-1 grid grid-cols-5 gap-1">
                    <div className="bg-caramel/60" />
                    <div className="bg-caramel/60" />
                    <div className="bg-caramel/60" />
                    <div className="bg-caramel/60" />
                    <div className="bg-caramel/60" />
                  </div>
                </div>
                <p className="font-mono text-[10px] uppercase tracking-widest text-olive mt-3">
                  VŠICHNI ZAČÍNAJÍ STEJNĚ → VYHRÁVÁ NEJLEPŠÍ ODPOVĚĎ
                </p>
              </div>
            </div>
          </RevealOnScroll>
        </div>
      </div>
    </section>
  );
}
