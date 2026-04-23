"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ChevronDown, Eye } from "lucide-react";
import { useIntro } from "@/lib/intro-context";
import DetectiveTag from "@/components/shared/DetectiveTag";
import MarkerUnderline from "@/components/shared/MarkerUnderline";
import Typewriter from "@/components/shared/Typewriter";
import { track } from "@/lib/track";

type StoryMode = null | "short" | "full";

export default function HeroDetective() {
  const { revealed, setRevealed } = useIntro();
  const [story, setStory] = useState<StoryMode>(null);

  useEffect(() => {
    if (revealed) return;

    const trigger = () => setRevealed(true);

    window.addEventListener("scroll", trigger, { once: true });
    window.addEventListener("wheel", trigger, { once: true });
    window.addEventListener("touchstart", trigger, { once: true });

    return () => {
      window.removeEventListener("scroll", trigger);
      window.removeEventListener("wheel", trigger);
      window.removeEventListener("touchstart", trigger);
    };
  }, [revealed, setRevealed]);

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden">
      {/* Background image */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/ilustrace/hero-detective-arbiq.png"
          alt=""
          fill
          className="object-cover object-center"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-espresso/60 via-transparent to-transparent" />
      </div>

      {/* Dark overlay — fades in on reveal */}
      <motion.div
        className="absolute inset-0 z-[1] bg-espresso/70"
        initial={{ opacity: 0 }}
        animate={{ opacity: revealed ? 1 : 0 }}
        transition={{ duration: 0.9, ease: "easeOut" }}
        style={{ pointerEvents: "none" }}
      />

      {/* Content */}
      <motion.div
        className="relative z-10 max-w-7xl mx-auto px-6 md:px-12 pt-32 pb-24 w-full"
        initial={{ opacity: 0 }}
        animate={{ opacity: revealed ? 1 : 0 }}
        transition={{ duration: 0.8, ease: "easeOut", delay: revealed ? 0.2 : 0 }}
        style={{ pointerEvents: revealed ? "auto" : "none" }}
      >
        <div className="max-w-3xl space-y-8">
          <DetectiveTag className="mb-2">PŘÍPAD #001 — OTEVŘEN {new Date().toLocaleDateString("cs-CZ", { day: "2-digit", month: "2-digit", year: "numeric" })}</DetectiveTag>

          <h1 className="font-display font-black text-moonlight leading-[0.9] text-5xl md:text-7xl lg:text-8xl">
            Váš digitální business má <MarkerUnderline>případ</MarkerUnderline>. My ho vyřešíme.
          </h1>

          <p className="text-lg md:text-xl text-sepia max-w-xl leading-relaxed font-light">
            <Typewriter
              text="ARBIQ je detektivní agentura pro weby, produkty a strategie. Najdeme, co Vám škodí — a opravíme to."
              start={revealed}
              delay={500}
            />
          </p>

          {/* Storytelling CTA */}
          <div className="flex flex-wrap gap-4 pt-4">
            <button
              onClick={() => { setStory(story === "short" ? null : "short"); track('cta_hero_story', { variant: 'short' }); }}
              className={`px-8 py-4 font-body text-sm uppercase tracking-wider font-bold transition-all ${
                story === "short"
                  ? "bg-caramel text-espresso"
                  : "bg-caramel/80 text-espresso hover:bg-caramel"
              }`}
            >
              Chci krátký příběh
            </button>
            <button
              onClick={() => { setStory(story === "full" ? null : "full"); track('cta_hero_story', { variant: 'full' }); }}
              className={`px-8 py-4 font-body text-sm uppercase tracking-wider transition-all ${
                story === "full"
                  ? "bg-caramel text-espresso font-bold"
                  : "border border-caramel text-caramel hover:bg-caramel/10"
              }`}
            >
              Chci celý případ
            </button>
          </div>

          {/* Expandable story */}
          <AnimatePresence mode="wait">
            {story === "short" && (
              <motion.div
                key="short"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="overflow-hidden"
              >
                <div className="border-l-2 border-caramel pl-6 py-4 space-y-4">
                  <p className="text-sepia/90 leading-relaxed">
                    Založili jsme ARBIQ, protože český digitální trh je plný prázdných slibů, webů od umělé inteligence a webařů, kteří točí reklamy v autě. My jsme šli jinou cestou. Specializujeme se na řemeslníky, start-upy a malé firmy — protože víme, že za dva roky z Vás budou firmy s mnohonásobně větším obratem. Investujeme vlastní čas a někdy i kapitál — a pro firmy, které splní naše kritéria, nabízíme platbu až po prvních výsledcích.
                  </p>
                </div>
              </motion.div>
            )}

            {story === "full" && (
              <motion.div
                key="full"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="overflow-hidden"
              >
                <div className="border-l-2 border-caramel pl-6 py-4 space-y-5 text-sepia/90 leading-relaxed">
                  <p>
                    Všechno začalo jednoduše. Viděli jsme, jak agentury prodávají WordPress šablony za padesát tisíc, které si klient může koupit sám za padesát dolarů. Viděli jsme, jak &bdquo;marketingoví specialisté&ldquo; posílají měsíční reporty plné grafů, které nikdo nečte — protože grafy nejsou výsledky. Viděli jsme, jak takzvaní webaři slibují web za pět tisíc, který přivede stovky zákazníků. To je lež. Web nepřivede zákazníky. To dělá marketing. Dobrý web jen nezahodí ty, které marketing přivede.
                  </p>
                  <p>
                    A pak jsme viděli něco horšího. Viděli jsme malé firmy — řemeslníky, začínající podnikatele, lidi s dobrým produktem a nulovým rozpočtem — jak platí za služby, které nefungují, lidem, kteří nerozumí jejich světu. Velká agentura sice bere i menší klienty — ale seniorní specialista nepracuje s rozpočtem pod sto tisíc měsíčně, a sazby jsou nastavené bez ohledu na menší firmy. Freelancer za pět tisíc dodá šablonu a zmizí. Nikdo nechce růst s malými firmami.
                  </p>
                  <p className="text-caramel font-display text-xl">
                    My ano.
                  </p>
                  <p>
                    ARBIQ se specializuje na řemeslníky, start-upy a malé firmy. Ne proto, že bychom neuměli nic jiného. Ale proto, že víme, co tyhle firmy potřebují, za kolik to potřebují, a hlavně — víme, kam se dostanou za dva roky, když jim pomůžeme správně.
                  </p>
                  <p>
                    Investujeme do partnerství. Investujeme svůj čas, expertízu a někdy i vlastní kapitál — to je u nás standardní praxe, ne výjimka. Pro menší firmy nebo firmy se špatnými zkušenostmi nabízíme i možnost platby až po prvních výsledcích — ale musíte splnit naše kritéria.
                  </p>
                  <p>
                    Říkáme tomu partnerství místo kšeftů. Sázíme na to, že za dva roky z Vás bude firma s mnohonásobně větším obratem. A my budeme ti, kdo Vám s tou správou pomůže.
                  </p>
                  <p>
                    Většina agentur bere malé klienty z nouze — protože nemají velké. My to děláme z přesvědčení.
                  </p>
                  <p>
                    A jestli si říkáte &bdquo;to zní moc hezky na to, aby to byla pravda&ldquo; — máte pravdu být skeptičtí. Proto máme Rentgen. Hodinová konzultace, kde Vám řekneme přesně, co je s Vaším podnikáním špatně. Pokud nebudete spokojeni, neplatíte nic. Tlapku na to.
                  </p>
                  <div className="pt-4">
                    <Link
                      href="/rentgen"
                      className="bg-caramel text-espresso px-8 py-4 font-mono text-xs uppercase tracking-widest font-bold hover:scale-[0.98] transition-transform inline-flex items-center gap-2"
                    >
                      Objednat Rentgen <ArrowRight size={14} />
                    </Link>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Editorial teaser */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-12 border-t border-sandstone/15">
            <div>
              <span className="font-display text-5xl float-left mr-3 mt-1 leading-[0.8] text-caramel">T</span>
              <p className="text-sm text-sepia/80 leading-relaxed">
                Tři podezřelí. Jeden detektiv. Jeden rys. Vyšetřujeme od roku 2026 a každý případ uzavíráme s důkazy.
              </p>
            </div>
            <div>
              <p className="text-sm text-sepia/80 font-serif-alt border-l-2 border-caramel pl-4 leading-relaxed">
                &ldquo;Ne každý web má problém. Ale každý problém má svůj web.&rdquo;
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-sandstone z-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: revealed ? 1 : 0 }}
        transition={{ duration: 0.6, delay: revealed ? 0.5 : 0 }}
      >
        <span className="font-mono text-[9px] uppercase tracking-[0.3em]">Pokračovat ve vyšetřování</span>
        <ChevronDown size={16} className="animate-bounce" />
      </motion.div>

      {/* Easter egg */}
      {revealed && (
        <button
          onClick={() => setRevealed(false)}
          className="absolute bottom-8 right-8 z-10 p-2 text-sandstone/30 hover:text-caramel/60 transition-colors"
          aria-label="Zobrazit obrázek"
          title="Zobrazit obrázek"
        >
          <Eye size={16} />
        </button>
      )}
    </section>
  );
}
