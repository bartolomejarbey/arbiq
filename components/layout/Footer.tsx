import Link from "next/link";
import Image from "next/image";
import WaxSeal from "@/components/shared/WaxSeal";

export default function Footer() {
  return (
    <footer className="bg-espresso border-t border-caramel/20 pt-24 pb-12 px-6 md:px-12 relative overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-10 lg:gap-8 mb-20">
          <div className="lg:col-span-1 sm:col-span-2 md:col-span-3 lg:col-auto">
            <Image
              src="/arbiq-logo.png"
              alt="ARBIQ"
              width={500}
              height={500}
              className="h-16 w-auto mb-5"
            />
            <p className="text-sepia/60 text-sm leading-relaxed mb-6">
              Detektivní agentura pro weby, produkty a strategie. Vyšetřujeme, proč váš digitální business nefunguje, a opravujeme to.
            </p>
            <div className="hidden lg:block">
              <WaxSeal text="UZAVŘEN" />
            </div>
          </div>

          <div>
            <h5 className="font-mono text-[10px] uppercase tracking-[0.3em] text-caramel mb-6">Zápisník</h5>
            <ul className="space-y-3">
              <li><Link href="/pripady" className="text-sepia hover:text-caramel text-sm font-mono uppercase tracking-wider transition-colors">Případy</Link></li>
              <li><Link href="/rentgen" className="text-sepia hover:text-caramel text-sm font-mono uppercase tracking-wider transition-colors">Rentgen</Link></li>
              <li><Link href="/manifest" className="text-sepia hover:text-caramel text-sm font-mono uppercase tracking-wider transition-colors">Manifest</Link></li>
              <li><Link href="/kontakt" className="text-sepia hover:text-caramel text-sm font-mono uppercase tracking-wider transition-colors">Kontakt</Link></li>
              <li><Link href="/aplikace" className="text-sepia hover:text-caramel text-sm font-mono uppercase tracking-wider transition-colors">Aplikace</Link></li>
              <li><Link href="/tym" className="text-sepia hover:text-caramel text-sm font-mono uppercase tracking-wider transition-colors">Tým</Link></li>
            </ul>
          </div>

          <div>
            <h5 className="font-mono text-[10px] uppercase tracking-[0.3em] text-caramel mb-6">Služby</h5>
            <ul className="space-y-3">
              <li><Link href="/sluzby/webove-stranky" className="text-sepia hover:text-caramel text-sm font-mono uppercase tracking-wider transition-colors">Webové stránky</Link></li>
              <li><Link href="/sluzby/ziskat-zakazky" className="text-sepia hover:text-caramel text-sm font-mono uppercase tracking-wider transition-colors">Získat zakázky</Link></li>
              <li><Link href="/sluzby/firma" className="text-sepia hover:text-caramel text-sm font-mono uppercase tracking-wider transition-colors">Pro firmy</Link></li>
              <li><Link href="/sluzby/systemy-na-miru" className="text-sepia hover:text-caramel text-sm font-mono uppercase tracking-wider transition-colors">Systémy na míru</Link></li>
              <li><Link href="/sluzby/automatizace" className="text-sepia hover:text-caramel text-sm font-mono uppercase tracking-wider transition-colors">Automatizace</Link></li>
              <li><Link href="/sluzby/seo" className="text-sepia hover:text-caramel text-sm font-mono uppercase tracking-wider transition-colors">SEO</Link></li>
            </ul>
          </div>

          <div>
            <h5 className="font-mono text-[10px] uppercase tracking-[0.3em] text-caramel mb-6">Pro koho</h5>
            <ul className="space-y-3">
              <li><Link href="/pripad/remeslnici" className="text-sepia hover:text-caramel text-sm font-mono uppercase tracking-wider transition-colors">Řemeslníci</Link></li>
              <li><Link href="/pripad/financni-poradci" className="text-sepia hover:text-caramel text-sm font-mono uppercase tracking-wider transition-colors">Finanční poradci</Link></li>
              <li><Link href="/pripad/realitni-makleri" className="text-sepia hover:text-caramel text-sm font-mono uppercase tracking-wider transition-colors">Realitní makléři</Link></li>
              <li><Link href="/pripad/startup" className="text-sepia hover:text-caramel text-sm font-mono uppercase tracking-wider transition-colors">Startupy</Link></li>
            </ul>
          </div>

          <div>
            <h5 className="font-mono text-[10px] uppercase tracking-[0.3em] text-caramel mb-6">Co řešíme</h5>
            <ul className="space-y-3">
              <li><Link href="/pripad/webove-stranky" className="text-sepia hover:text-caramel text-sm font-mono uppercase tracking-wider transition-colors">Webové stránky</Link></li>
              <li><Link href="/pripad/marketing" className="text-sepia hover:text-caramel text-sm font-mono uppercase tracking-wider transition-colors">Marketing</Link></li>
              <li><Link href="/pripad/automatizace" className="text-sepia hover:text-caramel text-sm font-mono uppercase tracking-wider transition-colors">Automatizace</Link></li>
              <li><Link href="/pripad/edukace" className="text-sepia hover:text-caramel text-sm font-mono uppercase tracking-wider transition-colors">Edukace a obsah</Link></li>
            </ul>
          </div>

          <div>
            <h5 className="font-mono text-[10px] uppercase tracking-[0.3em] text-caramel mb-6">Kontakt</h5>
            <ul className="space-y-3">
              <li><a href="mailto:info@arbiq.cz" className="text-sepia hover:text-caramel text-sm transition-colors">info@arbiq.cz</a></li>
              <li><a href="tel:+420725932729" className="text-sepia hover:text-caramel text-sm transition-colors">+420 725 932 729</a></li>
              <li className="text-sepia text-sm">Školská 689/20</li>
              <li className="text-sepia text-sm">110 00 Praha 1</li>
            </ul>
            <div className="lg:hidden mt-8">
              <WaxSeal text="UZAVŘEN" />
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-center pt-8 border-t border-caramel/10 gap-4">
          <p className="font-mono text-[10px] tracking-widest text-sepia/40 uppercase text-center md:text-left">
            © 2026 ARBIQ • Harotas s.r.o. • IČO: 21402027 • Školská 689/20, 110 00 Praha 1
          </p>
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-[10px] font-mono uppercase tracking-widest justify-center">
            <Link href="/gdpr" className="text-sepia/40 hover:text-caramel transition-colors">GDPR</Link>
            <Link href="/obchodni-podminky" className="text-sepia/40 hover:text-caramel transition-colors">Obchodní podmínky</Link>
            <Link href="/podminky-uzivani" className="text-sepia/40 hover:text-caramel transition-colors">Podmínky užívání</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
