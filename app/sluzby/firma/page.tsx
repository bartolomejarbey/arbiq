import Link from "next/link";
import DetectiveTag from "@/components/shared/DetectiveTag";
import MarkerUnderline from "@/components/shared/MarkerUnderline";
import { ArrowRight, CheckCircle } from "lucide-react";

export default function FirmaPage() {
  return (
    <div className="pt-32">
      {/* HERO */}
      <section className="pb-24 px-6 md:px-12">
        <div className="max-w-7xl mx-auto">
          <div className="max-w-3xl">
            <DetectiveTag className="mb-8">PRO FIRMY</DetectiveTag>
            <h1 className="font-display font-black text-moonlight text-5xl md:text-7xl leading-[0.9] mb-8">
              Jste malá firma s velkými <MarkerUnderline>ambicemi</MarkerUnderline>?
            </h1>
            <p className="text-lg md:text-xl text-sepia max-w-2xl leading-relaxed">
              Přizpůsobíme se Vašemu rozpočtu. Ne proto, že musíme — ale proto, že chceme.
            </p>
          </div>
        </div>
      </section>

      {/* PROČ MALÉ FIRMY */}
      <section className="py-24 bg-coffee">
        <div className="max-w-3xl mx-auto px-6 md:px-12">
          <DetectiveTag className="mb-4">NAŠE PŘESVĚDČENÍ</DetectiveTag>
          <h2 className="font-display font-black text-moonlight text-3xl md:text-5xl mb-10">
            Proč malé firmy
          </h2>
          <p className="text-sepia/80 text-lg leading-relaxed">
            Většina agentur bere malé firmy z nouze — protože nemají velké klienty. My to děláme z přesvědčení.
          </p>
        </div>
      </section>

      {/* JSME INVESTOŘI */}
      <section className="py-24 bg-parchment paper-texture text-espresso-text">
        <div className="max-w-3xl mx-auto px-6 md:px-12">
          <DetectiveTag variant="light" className="mb-4">PARTNERSTVÍ</DetectiveTag>
          <h2 className="font-display font-black text-espresso-text text-3xl md:text-5xl mb-10">
            Investujeme do partnerství
          </h2>
          <div className="text-brown-muted leading-relaxed space-y-4 text-lg">
            <p>
              Investujeme vlastní čas, expertízu a někdy i vlastní kapitál — to je u nás standardní praxe, ne výjimka. Věříme projektům, se kterými pracujeme.
            </p>
            <p>
              Pro menší firmy nebo firmy se špatnými zkušenostmi nabízíme i možnost odměny až po prvních výsledcích. Tento model ale vyžaduje splnění našich kritérií — není automaticky pro každého.
            </p>
          </div>
        </div>
      </section>

      {/* CO NABÍZÍME */}
      <section className="py-24 bg-espresso">
        <div className="max-w-4xl mx-auto px-6 md:px-12">
          <DetectiveTag className="mb-4">CO NABÍZÍME</DetectiveTag>
          <h2 className="font-display font-black text-moonlight text-3xl md:text-5xl mb-12">
            Pro Vaši firmu
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              "Digitální strategie na míru",
              "Flexibilní ceník podle Vašich možností",
              "Měsíční reporting s reálnými čísly",
              "Osobní přístup — žádné tickety, žádné fronty",
            ].map((f) => (
              <div key={f} className="flex items-start gap-3 bg-coffee border border-tobacco p-5">
                <CheckCircle size={18} className="text-caramel shrink-0 mt-0.5" />
                <span className="text-sepia/80 text-sm">{f}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-coffee text-center">
        <div className="max-w-3xl mx-auto px-6 md:px-12">
          <Link
            href="/kontakt"
            className="bg-caramel text-espresso px-10 py-5 font-mono text-xs uppercase tracking-widest font-bold hover:bg-caramel-light transition-all shadow-xl inline-flex items-center gap-2"
          >
            Domluvit první schůzku <ArrowRight size={14} />
          </Link>
        </div>
      </section>
    </div>
  );
}
