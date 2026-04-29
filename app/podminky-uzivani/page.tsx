import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Podmínky užívání webu",
  description: "Pravidla pro užívání webu arbiq.cz, AI chatbotu a klientského portálu.",
  alternates: { canonical: "/podminky-uzivani" },
};

export default function PodminkyUzivaniPage() {
  return (
    <article className="pt-32 pb-24 px-6 md:px-12 max-w-3xl mx-auto text-sepia leading-relaxed">
      <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-caramel mb-4">Podmínky užívání</div>
      <h1 className="font-display italic font-black text-moonlight text-4xl md:text-5xl mb-2">Podmínky užívání webu</h1>
      <p className="text-sandstone font-mono text-xs mb-12">Účinné od 1. 1. 2026 · Verze 1.0</p>

      <div className="space-y-8 text-[15px]">

        <section>
          <h2 className="font-display italic font-black text-moonlight text-2xl mb-3">1. Provozovatel</h2>
          <p>
            Provozovatelem webu <strong className="text-moonlight">arbiq.cz</strong> je společnost <strong className="text-moonlight">Harotas s.r.o.</strong>, IČO 21402027, se sídlem Školská 689/20, 110 00 Praha 1.
          </p>
          <p className="mt-3">Tyto podmínky upravují užívání webu, AI chatbotu, klientského portálu a všech souvisejících nástrojů.</p>
        </section>

        <section>
          <h2 className="font-display italic font-black text-moonlight text-2xl mb-3">2. Užívání webu</h2>
          <p>Web je veřejně přístupný. Návštěvník se zavazuje:</p>
          <ul className="list-disc pl-6 mt-3 space-y-2">
            <li>Užívat web v souladu s právními předpisy ČR a EU.</li>
            <li>Neporušovat autorská práva — texty, design, kód, ilustrace a fotografie jsou chráněny zákonem.</li>
            <li>Nepoužívat automatizované nástroje (scrapery, crawlery, boty) k masovému stahování obsahu nebo zatěžování serveru.</li>
            <li>Nezneužívat formuláře (spam, falešné poptávky) — chráníme se honeypot poli a rate limity.</li>
            <li>Neprovádět pokusy o průnik do systému nebo obcházení bezpečnostních opatření.</li>
          </ul>
        </section>

        <section>
          <h2 className="font-display italic font-black text-moonlight text-2xl mb-3">3. AI chatbot</h2>
          <p>Web obsahuje AI chatbota postaveného nad službou OpenAI. Při jeho používání platí:</p>
          <ul className="list-disc pl-6 mt-3 space-y-2">
            <li>Odpovědi generuje umělá inteligence — mohou obsahovat chyby nebo být nepřesné. Pro závazné nabídky a smluvní informace vždy kontaktujte ARBIQ přímo.</li>
            <li>Konverzace ukládáme pro účely zlepšování služby a ochrany před zneužitím (rate limit 30 zpráv / IP / hodinu).</li>
            <li>Nezadávejte do chatu citlivé osobní údaje, hesla, čísla platebních karet ani důvěrné firemní informace.</li>
            <li>Obsah chatu zpracovávají servery OpenAI (USA) — viz <Link href="/gdpr" className="text-caramel hover:text-caramel-light">GDPR</Link>.</li>
          </ul>
        </section>

        <section>
          <h2 className="font-display italic font-black text-moonlight text-2xl mb-3">4. Klientský portál</h2>
          <p>
            Klientský portál (<strong className="text-moonlight">arbiq.cz/portal</strong>) je dostupný pouze klientům s aktivním přístupovým účtem. Klient je povinen:
          </p>
          <ul className="list-disc pl-6 mt-3 space-y-2">
            <li>Chránit přístupové údaje, neposkytovat je třetím osobám.</li>
            <li>Při podezření na zneužití účtu okamžitě informovat ARBIQ na <a href="mailto:info@arbey.cz" className="text-caramel hover:text-caramel-light">info@arbey.cz</a>.</li>
            <li>Užívat portál v souladu se smlouvou — nezneužívat ho k jiným účelům než ke správě vlastních projektů.</li>
          </ul>
          <p className="mt-3">Portál je dostupný v režimu „best-effort" — nezaručujeme nepřetržitou dostupnost. Plánovanou údržbu oznamujeme s předstihem.</p>
        </section>

        <section>
          <h2 className="font-display italic font-black text-moonlight text-2xl mb-3">5. Demo / náhledový režim</h2>
          <p>
            Web nabízí <strong className="text-moonlight">demo režim</strong> klientského portálu, ve kterém návštěvník bez přihlášení vidí ukázková (smyšlená) data — fiktivní detektivní agenturu se zákazníky inspirovanými klasickou krimi-literaturou. Tato data jsou čistě ilustrativní a nepředstavují žádné skutečné osoby ani vztahy.
          </p>
        </section>

        <section>
          <h2 className="font-display italic font-black text-moonlight text-2xl mb-3">6. Cookies a tracking</h2>
          <p>
            Web používá nezbytné cookies (vždy aktivní) a — se souhlasem návštěvníka — analytické cookies. Detaily najdete v <Link href="/gdpr" className="text-caramel hover:text-caramel-light">zásadách GDPR</Link>. Cookie banner můžete kdykoliv vyvolat smazáním cookies prohlížeče.
          </p>
        </section>

        <section>
          <h2 className="font-display italic font-black text-moonlight text-2xl mb-3">7. Odpovědnost za obsah</h2>
          <p>
            Obsah webu (texty, ceny, popisy služeb) má informativní charakter. Závazné jsou pouze informace v individuálních cenových nabídkách a smlouvách. Web může obsahovat odkazy na služby třetích stran — ARBIQ neodpovídá za jejich obsah ani dostupnost.
          </p>
          <p className="mt-3">
            ARBIQ vynakládá přiměřené úsilí na to, aby informace na webu byly aktuální a přesné, ale nezaručuje jejich úplnost ani bezchybnost. Užívání informací z webu je na vlastní riziko návštěvníka.
          </p>
        </section>

        <section>
          <h2 className="font-display italic font-black text-moonlight text-2xl mb-3">8. Autorská práva</h2>
          <p>
            Veškerý obsah webu — texty, design, ilustrace, kód komponent, fotografie — je autorským dílem a vztahuje se na něj zákon č. 121/2000 Sb. (autorský zákon). Bez výslovného souhlasu ARBIQ je zakázáno tento obsah:
          </p>
          <ul className="list-disc pl-6 mt-3 space-y-2">
            <li>Kopírovat a šířit (s výjimkou citace s uvedením zdroje a odkazu).</li>
            <li>Upravovat nebo používat ke komerčním účelům.</li>
            <li>Trénovat na něm AI modely bez souhlasu.</li>
          </ul>
          <p className="mt-3">Logo ARBIQ a název Harotas s.r.o. jsou chráněny.</p>
        </section>

        <section>
          <h2 className="font-display italic font-black text-moonlight text-2xl mb-3">9. Změny podmínek</h2>
          <p>
            ARBIQ může tyto podmínky upravit. Aktuální verze je vždy dostupná na této stránce. Pokračováním v užívání webu po změnách vyjadřujete s novou verzí souhlas.
          </p>
        </section>

        <section>
          <h2 className="font-display italic font-black text-moonlight text-2xl mb-3">10. Kontakt</h2>
          <p>
            Otázky, připomínky, žádosti směřujte na <a href="mailto:info@arbey.cz" className="text-caramel hover:text-caramel-light">info@arbey.cz</a>. Odpovídáme do 5 pracovních dní.
          </p>
        </section>

        <div className="flex gap-4 pt-8 border-t border-tobacco">
          <Link href="/gdpr" className="text-caramel hover:text-caramel-light text-sm font-mono uppercase tracking-widest">GDPR →</Link>
          <Link href="/obchodni-podminky" className="text-caramel hover:text-caramel-light text-sm font-mono uppercase tracking-widest">Obchodní podmínky →</Link>
        </div>

      </div>
    </article>
  );
}
