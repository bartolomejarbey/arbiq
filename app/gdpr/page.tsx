import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "GDPR — Ochrana osobních údajů",
  description: "Jak ARBIQ (Harotas s.r.o.) zpracovává osobní údaje návštěvníků webu, klientů a zájemců o služby.",
  alternates: { canonical: "/gdpr" },
};

export default function GDPRPage() {
  return (
    <article className="pt-32 pb-24 px-6 md:px-12 max-w-3xl mx-auto text-sepia leading-relaxed">
      <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-caramel mb-4">GDPR · Ochrana osobních údajů</div>
      <h1 className="font-display italic font-black text-moonlight text-4xl md:text-5xl mb-2">Zásady zpracování osobních údajů</h1>
      <p className="text-sandstone font-mono text-xs mb-12">Účinné od 1. 1. 2026 · Verze 1.0</p>

      <div className="space-y-8 text-[15px]">

        <section>
          <h2 className="font-display italic font-black text-moonlight text-2xl mb-3">1. Správce osobních údajů</h2>
          <p>
            Správcem osobních údajů je společnost <strong className="text-moonlight">Harotas s.r.o.</strong>, IČO 21402027, se sídlem
            Školská 689/20, 110 00 Praha 1, zapsaná v obchodním rejstříku vedeném Městským soudem v Praze (dále jen „Správce" nebo „ARBIQ").
          </p>
          <p className="mt-3">Kontaktní e-mail pro otázky GDPR: <a href="mailto:info@arbiq.cz" className="text-caramel hover:text-caramel-light">info@arbiq.cz</a></p>
        </section>

        <section>
          <h2 className="font-display italic font-black text-moonlight text-2xl mb-3">2. Jaké údaje zpracováváme</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong className="text-moonlight">Identifikační údaje:</strong> jméno, příjmení, název firmy, IČO, DIČ</li>
            <li><strong className="text-moonlight">Kontaktní údaje:</strong> e-mail, telefonní číslo, adresa</li>
            <li><strong className="text-moonlight">Údaje z formulářů:</strong> obsah zpráv, popis poptávané služby, odpovědi v dotaznících kampaní</li>
            <li><strong className="text-moonlight">Technické údaje:</strong> IP adresa (hashovaná SHA-256 s denním saltem), typ prohlížeče, OS, jazyk, navštěvované stránky</li>
            <li><strong className="text-moonlight">Marketingové údaje:</strong> UTM parametry, zdroj návštěvy, interakce s reklamními kampaněmi</li>
            <li><strong className="text-moonlight">Fakturační údaje:</strong> u klientů — bankovní spojení, fakturační adresa, historie objednávek</li>
          </ul>
        </section>

        <section>
          <h2 className="font-display italic font-black text-moonlight text-2xl mb-3">3. Účel a právní základ zpracování</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-tobacco">
                <th className="text-left text-caramel font-mono text-[10px] uppercase tracking-widest py-2">Účel</th>
                <th className="text-left text-caramel font-mono text-[10px] uppercase tracking-widest py-2">Právní základ</th>
                <th className="text-left text-caramel font-mono text-[10px] uppercase tracking-widest py-2">Doba uchování</th>
              </tr>
            </thead>
            <tbody className="text-sepia/90">
              <tr className="border-b border-tobacco/40"><td className="py-2 pr-4">Vyřízení poptávky / odpověď na dotaz</td><td className="py-2 pr-4">Oprávněný zájem</td><td className="py-2">3 roky</td></tr>
              <tr className="border-b border-tobacco/40"><td className="py-2 pr-4">Plnění smlouvy (vývoj, realizace)</td><td className="py-2 pr-4">Plnění smlouvy</td><td className="py-2">10 let (zákon o účetnictví)</td></tr>
              <tr className="border-b border-tobacco/40"><td className="py-2 pr-4">Fakturace, účetnictví</td><td className="py-2 pr-4">Právní povinnost</td><td className="py-2">10 let</td></tr>
              <tr className="border-b border-tobacco/40"><td className="py-2 pr-4">Marketing & remarketing</td><td className="py-2 pr-4">Souhlas (cookie banner)</td><td className="py-2">12 měsíců</td></tr>
              <tr className="border-b border-tobacco/40"><td className="py-2 pr-4">Analytika návštěvnosti</td><td className="py-2 pr-4">Souhlas (cookie banner)</td><td className="py-2">14 měsíců</td></tr>
              <tr className="border-b border-tobacco/40"><td className="py-2 pr-4">GDPR audit trail (consent log)</td><td className="py-2 pr-4">Právní povinnost</td><td className="py-2">3 roky</td></tr>
              <tr><td className="py-2 pr-4">Klientský portál (přihlášení, projekty, faktury)</td><td className="py-2 pr-4">Plnění smlouvy</td><td className="py-2">Po dobu spolupráce + 3 roky</td></tr>
            </tbody>
          </table>
        </section>

        <section>
          <h2 className="font-display italic font-black text-moonlight text-2xl mb-3">4. Komu údaje předáváme</h2>
          <p>Vaše osobní údaje předáváme pouze následujícím zpracovatelům, se kterými máme uzavřenou smlouvu o zpracování:</p>
          <ul className="list-disc pl-6 mt-3 space-y-2">
            <li><strong className="text-moonlight">Supabase Inc.</strong> (USA, EU-Frankfurt region) — databázové úložiště, autentizace</li>
            <li><strong className="text-moonlight">Vercel Inc.</strong> (USA, EU-Frankfurt region) — hosting webu</li>
            <li><strong className="text-moonlight">Resend Inc.</strong> (USA) — odesílání transakčních e-mailů</li>
            <li><strong className="text-moonlight">OpenAI</strong> (USA) — AI chatbot (pouze obsah konverzace, žádné kontaktní údaje)</li>
            <li><strong className="text-moonlight">Účetní firma</strong> — dle aktuální smlouvy (na vyžádání sdělíme)</li>
          </ul>
          <p className="mt-3 text-sandstone text-sm">
            S přenosem údajů mimo EU (USA) je zacházeno v souladu s rozhodnutím Evropské komise o adekvátní úrovni ochrany (Data Privacy Framework).
          </p>
        </section>

        <section>
          <h2 className="font-display italic font-black text-moonlight text-2xl mb-3">5. Vaše práva</h2>
          <p>V souvislosti se zpracováním Vašich osobních údajů máte tato práva:</p>
          <ul className="list-disc pl-6 mt-3 space-y-2">
            <li><strong className="text-moonlight">Právo na přístup</strong> — můžete si vyžádat informaci o tom, jaké údaje o Vás zpracováváme</li>
            <li><strong className="text-moonlight">Právo na opravu</strong> — pokud jsou údaje nepřesné, máte právo na jejich opravu</li>
            <li><strong className="text-moonlight">Právo na výmaz („právo být zapomenut")</strong> — pokud již údaje nejsou potřeba pro účely, pro které byly shromážděny</li>
            <li><strong className="text-moonlight">Právo na omezení zpracování</strong> — v určitých případech (např. během řešení sporu)</li>
            <li><strong className="text-moonlight">Právo na přenositelnost údajů</strong> — můžete si vyžádat strukturovaný export Vašich dat</li>
            <li><strong className="text-moonlight">Právo vznést námitku</strong> — proti zpracování na základě oprávněného zájmu</li>
            <li><strong className="text-moonlight">Právo odvolat souhlas</strong> — kdykoliv pro účely, kde byl souhlas právním základem</li>
            <li><strong className="text-moonlight">Právo podat stížnost</strong> u dozorového úřadu (Úřad pro ochranu osobních údajů, Pplk. Sochora 27, 170 00 Praha 7, <a href="https://uoou.gov.cz" className="text-caramel">uoou.gov.cz</a>)</li>
          </ul>
          <p className="mt-3">Pro uplatnění práv nás kontaktujte na <a href="mailto:info@arbiq.cz" className="text-caramel hover:text-caramel-light">info@arbiq.cz</a>. Odpovídáme do 30 dní.</p>
        </section>

        <section>
          <h2 className="font-display italic font-black text-moonlight text-2xl mb-3">6. Cookies</h2>
          <p>
            Web používá tři kategorie cookies. Před nahráním analytických a marketingových cookies žádáme Váš souhlas přes cookie banner, který se Vám zobrazí při první návštěvě.
          </p>
          <ul className="list-disc pl-6 mt-3 space-y-2">
            <li><strong className="text-moonlight">Nezbytné</strong> — přihlášení do portálu, bezpečnost, preference jazyka. Vždy aktivní, právní základ: oprávněný zájem.</li>
            <li><strong className="text-moonlight">Analytické</strong> — vlastní lehký tracker (page views, kliknutí). Hashovaná IP, žádný cross-site tracking. Pouze se souhlasem.</li>
            <li><strong className="text-moonlight">Marketingové</strong> — Meta Pixel a Google Ads. Pouze se souhlasem.</li>
          </ul>
          <p className="mt-3">Souhlas můžete kdykoliv odvolat — vymažte cookies prohlížeče nebo nás kontaktujte. Audit trail souhlasů ukládáme pro případnou kontrolu ÚOOÚ po dobu 3 let.</p>
        </section>

        <section>
          <h2 className="font-display italic font-black text-moonlight text-2xl mb-3">7. Bezpečnost</h2>
          <p>
            Vaše údaje chráníme šifrováním (TLS 1.2+) při přenosu i v klidu. Přístup k datům mají pouze pověření zaměstnanci a smluvní zpracovatelé. Hesla jsou hashována (Argon2 / bcrypt). Provádíme pravidelné bezpečnostní audity.
          </p>
        </section>

        <section>
          <h2 className="font-display italic font-black text-moonlight text-2xl mb-3">8. Změny zásad</h2>
          <p>
            Tyto zásady můžeme upravit. Aktuální verze je vždy dostupná na této stránce. O podstatných změnách Vás informujeme e-mailem (pokud máme Váš kontakt) nebo informací na webu.
          </p>
        </section>

        <p className="text-sandstone text-sm pt-8 border-t border-tobacco">
          Máte-li dotaz, napište na <a href="mailto:info@arbiq.cz" className="text-caramel hover:text-caramel-light">info@arbiq.cz</a>. Děkujeme za důvěru.
        </p>

        <div className="flex gap-4 pt-8">
          <Link href="/obchodni-podminky" className="text-caramel hover:text-caramel-light text-sm font-mono uppercase tracking-widest">Obchodní podmínky →</Link>
          <Link href="/podminky-uzivani" className="text-caramel hover:text-caramel-light text-sm font-mono uppercase tracking-widest">Podmínky užívání →</Link>
        </div>

      </div>
    </article>
  );
}
