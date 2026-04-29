import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Obchodní podmínky",
  description: "Obchodní podmínky pro objednávku služeb ARBIQ (Harotas s.r.o.) — vývoj webů, audit, konzultace, aplikace na míru.",
  alternates: { canonical: "/obchodni-podminky" },
};

export default function ObchodniPodminkyPage() {
  return (
    <article className="pt-32 pb-24 px-6 md:px-12 max-w-3xl mx-auto text-sepia leading-relaxed">
      <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-caramel mb-4">Obchodní podmínky</div>
      <h1 className="font-display italic font-black text-moonlight text-4xl md:text-5xl mb-2">Obchodní podmínky</h1>
      <p className="text-sandstone font-mono text-xs mb-12">Účinné od 1. 1. 2026 · Verze 1.0</p>

      <div className="space-y-8 text-[15px]">

        <section>
          <h2 className="font-display italic font-black text-moonlight text-2xl mb-3">1. Smluvní strany</h2>
          <p>
            <strong className="text-moonlight">Poskytovatelem</strong> je společnost Harotas s.r.o., IČO 21402027, se sídlem Školská 689/20, 110 00 Praha 1, zapsaná v obchodním rejstříku vedeném Městským soudem v Praze, podnikající pod značkou <strong className="text-moonlight">ARBIQ</strong> (dále jen „Poskytovatel").
          </p>
          <p className="mt-3">
            <strong className="text-moonlight">Klientem</strong> je fyzická nebo právnická osoba, která si u Poskytovatele objedná službu (dále jen „Klient").
          </p>
        </section>

        <section>
          <h2 className="font-display italic font-black text-moonlight text-2xl mb-3">2. Předmět služeb</h2>
          <p>Poskytovatel nabízí zejména:</p>
          <ul className="list-disc pl-6 mt-3 space-y-2">
            <li>Návrh a vývoj webových stránek a e-shopů</li>
            <li>Vývoj systémů a aplikací na míru (CRM, rezervační systémy, klientské zóny, automatizace)</li>
            <li>Marketingové služby (SEO, PPC kampaně, brand identita)</li>
            <li>Konzultace a audity (Rentgen)</li>
            <li>Provoz a správa řešení (hosting, údržba, bezpečnostní aktualizace)</li>
          </ul>
        </section>

        <section>
          <h2 className="font-display italic font-black text-moonlight text-2xl mb-3">3. Vznik smluvního vztahu</h2>
          <p>
            Smluvní vztah vzniká uzavřením písemné smlouvy o dílo nebo akceptací cenové nabídky Klientem (e-mailem stačí). Před zahájením rozsáhlejších projektů Poskytovatel zpravidla provádí <strong className="text-moonlight">Rentgen</strong> (vstupní audit za 1 500 Kč) — ten není závazkem k další spolupráci.
          </p>
        </section>

        <section>
          <h2 className="font-display italic font-black text-moonlight text-2xl mb-3">4. Cena a platební podmínky</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>Ceny uvádíme bez DPH (Poskytovatel je plátcem DPH).</li>
            <li>Pro projekty nad 30 000 Kč zpravidla účtujeme <strong className="text-moonlight">zálohu 30–50 %</strong> před zahájením prací, zbytek po předání nebo v dohodnutých milnících.</li>
            <li>Splatnost faktur je <strong className="text-moonlight">14 dní</strong>, pokud není sjednáno jinak.</li>
            <li>Při prodlení s platbou účtujeme úrok z prodlení dle občanského zákoníku a smluvní pokutu 0,05 % z dlužné částky za každý den prodlení.</li>
            <li>Pokud Rentgen ústí ve spolupráci, jeho cena (1 500 Kč) je odečtena z první faktury.</li>
          </ul>
        </section>

        <section>
          <h2 className="font-display italic font-black text-moonlight text-2xl mb-3">5. Termíny a předání</h2>
          <p>
            Termíny dodání jsou orientační a vychází z odhadu na začátku projektu. Poskytovatel se zavazuje informovat Klienta o významných odchylkách. Předání díla probíhá v elektronické podobě (přístup do administrace, repozitář, dokumentace) a je doloženo předávacím protokolem nebo e-mailem.
          </p>
          <p className="mt-3">
            Klient má <strong className="text-moonlight">14 dní na akceptaci díla</strong> od jeho předání. Pokud v této lhůtě nesdělí konkrétní výhrady, dílo se považuje za schválené.
          </p>
        </section>

        <section>
          <h2 className="font-display italic font-black text-moonlight text-2xl mb-3">6. Záruka a odpovědnost</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>Záruka <strong className="text-moonlight">3 měsíce</strong> na bezvadný chod díla od jeho předání. Záruka se vztahuje na vady vzniklé chybou Poskytovatele, nikoliv na vady způsobené zásahem třetí strany, špatným použitím nebo změnou prostředí (např. změna verze CMS).</li>
            <li>Odpovědnost Poskytovatele za škodu je omezena výší ceny díla.</li>
            <li>Poskytovatel neodpovídá za výpadky služeb třetích stran (Vercel, Supabase, Google, Meta, atd.).</li>
          </ul>
        </section>

        <section>
          <h2 className="font-display italic font-black text-moonlight text-2xl mb-3">7. Autorská práva a licence</h2>
          <p>
            Po úplném zaplacení ceny díla nabývá Klient výhradní licenci k užívání díla pro vlastní potřeby. Zdrojový kód a designové podklady náleží Klientovi. Poskytovatel si vyhrazuje právo:
          </p>
          <ul className="list-disc pl-6 mt-3 space-y-2">
            <li>Uvést dílo v portfoliu (s názvem, screenshotem, tagem služby) — pokud Klient výslovně nepožádá o opak.</li>
            <li>Použít obecné komponenty, knihovny a postupy v dalších projektech.</li>
          </ul>
        </section>

        <section>
          <h2 className="font-display italic font-black text-moonlight text-2xl mb-3">8. Odstoupení od smlouvy</h2>
          <p>
            Klient i Poskytovatel mohou od smlouvy odstoupit písemně, zejména z důvodu podstatného porušení smluvních povinností. V případě odstoupení Klientem v průběhu prací uhradí Klient cenu již provedeného plnění (zpravidla dle hodinového výkazu nebo procenta dokončenosti).
          </p>
        </section>

        <section>
          <h2 className="font-display italic font-black text-moonlight text-2xl mb-3">9. Spotřebitelská práva</h2>
          <p>
            Pokud je Klient spotřebitelem (fyzická osoba, která neuzavírá smlouvu v rámci své podnikatelské činnosti), má právo:
          </p>
          <ul className="list-disc pl-6 mt-3 space-y-2">
            <li>Odstoupit od smlouvy uzavřené distančním způsobem do <strong className="text-moonlight">14 dnů</strong> bez udání důvodu (pokud Poskytovatel již nezahájil plnění s výslovným souhlasem Klienta).</li>
            <li>Mimosoudně řešit spor u České obchodní inspekce: <a href="https://adr.coi.cz" className="text-caramel">adr.coi.cz</a>.</li>
          </ul>
        </section>

        <section>
          <h2 className="font-display italic font-black text-moonlight text-2xl mb-3">10. Závěrečná ustanovení</h2>
          <p>
            Smluvní vztah se řídí právem České republiky, zejména zákonem č. 89/2012 Sb., občanským zákoníkem. Případné spory budou řešeny u věcně a místně příslušného soudu v Praze. Tyto obchodní podmínky mohou být měněny — aktuální verze je vždy dostupná na této stránce.
          </p>
        </section>

        <p className="text-sandstone text-sm pt-8 border-t border-tobacco">
          Otázky? Napište na <a href="mailto:info@arbey.cz" className="text-caramel hover:text-caramel-light">info@arbey.cz</a>.
        </p>

        <div className="flex gap-4 pt-8">
          <Link href="/gdpr" className="text-caramel hover:text-caramel-light text-sm font-mono uppercase tracking-widest">GDPR →</Link>
          <Link href="/podminky-uzivani" className="text-caramel hover:text-caramel-light text-sm font-mono uppercase tracking-widest">Podmínky užívání →</Link>
        </div>

      </div>
    </article>
  );
}
