"use client";

import { useState, use } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ArrowLeft, Check } from "lucide-react";
import Link from "next/link";
import { kampanData, velikostOptions, WANTS_OPTIONS, BUDGET_OPTIONS, type KampanKey } from "@/lib/kampan-data";
import { track } from "@/lib/track";

type Answers = {
  obor: string;
  velikost: string;
  wants: string[];
  budget: string;
  name: string;
  email: string;
  phone: string;
  url: string;
  popis: string;
};

const TOTAL_STEPS = 6;

export default function PripadPage({
  params,
}: {
  params: Promise<{ kampan: string }>;
}) {
  const { kampan } = use(params);
  const config = kampanData[kampan as KampanKey];

  const [step, setStep] = useState(1);
  const [answers, setAnswers] = useState<Answers>({
    obor: "",
    velikost: "",
    wants: [],
    budget: "",
    name: "",
    email: "",
    phone: "",
    url: "",
    popis: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [caseNumber, setCaseNumber] = useState("");

  if (!config) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="font-display text-4xl text-moonlight mb-4">Případ nenalezen</h1>
          <Link href="/" className="text-caramel font-mono text-sm uppercase tracking-widest">
            Zpět na hlavní stránku
          </Link>
        </div>
      </div>
    );
  }

  const progress = (step / TOTAL_STEPS) * 100;

  function selectCard(field: keyof Answers, value: string, nextStep: number) {
    setAnswers((prev) => ({ ...prev, [field]: value }));
    setTimeout(() => {
      setStep(nextStep);
      track('pripad_step', { step: nextStep, kampan });
    }, 300);
  }

  function toggleWant(id: string) {
    setAnswers((prev) => ({
      ...prev,
      wants: prev.wants.includes(id)
        ? prev.wants.filter((w) => w !== id)
        : [...prev.wants, id],
    }));
  }

  async function handleSubmit() {
    if (!answers.name || !answers.email) return;
    setSubmitting(true);
    let num = "#" + String(Math.floor(Math.random() * 9000) + 1000);
    try {
      const params = new URLSearchParams(window.location.search);
      const hp = (document.getElementById("website_url_hp") as HTMLInputElement | null)?.value ?? "";
      const res = await fetch("/api/pripad", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kampan,
          obor: answers.obor,
          velikost: answers.velikost,
          step3: answers.wants.join(", "), // Backward-compat: serialize wants do step3 textu
          wants: answers.wants,
          budget: answers.budget,
          name: answers.name,
          email: answers.email,
          phone: answers.phone,
          url: answers.url,
          popis: answers.popis,
          utm_source: params.get("utm_source") || "",
          utm_medium: params.get("utm_medium") || "",
          utm_campaign: params.get("utm_campaign") || "",
          website_url_hp: hp,
        }),
      });
      if (res.ok) {
        const payload = (await res.json().catch(() => null)) as { caseNumber?: string } | null;
        if (payload?.caseNumber) num = payload.caseNumber;
      }
    } catch {
      // network error — keep the local fallback caseNumber
    }
    setCaseNumber(num);
    setSubmitting(false);
    setStep(6);
  }

  const slideVariants = {
    enter: { x: 80, opacity: 0 },
    center: { x: 0, opacity: 1 },
    exit: { x: -80, opacity: 0 },
  };

  return (
    <div className="min-h-screen bg-espresso relative flex flex-col">
      {/* Honeypot for spam bots */}
      <div aria-hidden style={{ position: "absolute", left: "-9999px", opacity: 0, pointerEvents: "none" }}>
        <input id="website_url_hp" type="text" name="website_url_hp" tabIndex={-1} autoComplete="off" defaultValue="" />
      </div>

      {/* Progress bar — z-[100] aby překrýval fixed nav (z-50) */}
      <div className="fixed top-0 left-0 right-0 z-[100] bg-espresso backdrop-blur-sm px-6 py-3 border-b border-caramel/10 shadow-[0_4px_20px_rgba(0,0,0,0.4)]">
        <div className="max-w-xl mx-auto">
          <div className="flex items-center justify-between mb-2">
            <span className="font-mono text-[10px] uppercase tracking-widest text-sandstone">
              Vyšetřování — krok {step} / {TOTAL_STEPS}
            </span>
            <span className="font-mono text-[10px] uppercase tracking-widest text-caramel">
              {Math.round(progress)} %
            </span>
          </div>
          <div className="h-1.5 bg-tobacco overflow-hidden">
            <motion.div
              className="h-full bg-caramel"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </div>
        </div>
      </div>

      {/* Steps */}
      <div className="flex-1 flex items-center justify-center px-6 pt-24 pb-12">
        <div className="w-full max-w-2xl">
          <AnimatePresence mode="wait">
            {/* STEP 1: Intro */}
            {step === 1 && (
              <motion.div
                key="step1"
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.4 }}
                className="text-center space-y-8"
              >
                <span className="font-mono text-[10px] uppercase tracking-widest text-caramel block">
                  PŘÍPAD OTEVŘEN
                </span>
                <h1 className="font-display font-black text-moonlight text-4xl md:text-6xl leading-[0.95]">
                  {config.headline}
                </h1>
                <p className="text-sepia/80 text-lg max-w-lg mx-auto leading-relaxed">
                  {config.description}
                </p>
                <button
                  onClick={() => setStep(2)}
                  className="bg-caramel text-espresso px-10 py-5 font-mono text-xs uppercase tracking-widest font-bold hover:bg-caramel-light transition-all shadow-xl inline-flex items-center gap-2 mx-auto"
                >
                  Otevřít případ <ArrowRight size={14} />
                </button>
              </motion.div>
            )}

            {/* STEP 2: Identifikace (obor + velikost) */}
            {step === 2 && (
              <motion.div
                key="step2"
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.4 }}
                className="space-y-10"
              >
                <div className="text-center">
                  <span className="font-mono text-[10px] uppercase tracking-widest text-caramel block mb-4">
                    IDENTIFIKACE SVĚDKA
                  </span>
                  <h2 className="font-display font-black text-moonlight text-3xl md:text-5xl">
                    Kdo jste?
                  </h2>
                </div>

                {!answers.obor ? (
                  <div>
                    <p className="text-sandstone font-mono text-xs uppercase tracking-widest text-center mb-6">
                      Jaký je Váš obor?
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {config.step2Obory.map((obor) => (
                        <button
                          key={obor}
                          onClick={() => selectCard("obor", obor, 2)}
                          className="bg-coffee border border-tobacco p-5 text-left text-moonlight hover:border-caramel hover:bg-caramel/5 transition-all font-medium"
                        >
                          {obor}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : !answers.velikost ? (
                  <div>
                    <p className="text-sandstone font-mono text-xs uppercase tracking-widest text-center mb-6">
                      Jak velká je Vaše firma?
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      {velikostOptions.map((v) => (
                        <button
                          key={v}
                          onClick={() => selectCard("velikost", v, 3)}
                          className="bg-coffee border border-tobacco p-5 text-left text-moonlight hover:border-caramel hover:bg-caramel/5 transition-all font-medium"
                        >
                          {v}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}

                {answers.obor && (
                  <button
                    onClick={() => setAnswers((p) => ({ ...p, obor: "", velikost: "" }))}
                    className="text-sandstone/50 font-mono text-[10px] uppercase tracking-widest hover:text-caramel transition-colors flex items-center gap-1 mx-auto"
                  >
                    <ArrowLeft size={10} /> Zpět
                  </button>
                )}
              </motion.div>
            )}

            {/* STEP 3: Co všechno chcete? (multi-select 16 variant) */}
            {step === 3 && (
              <motion.div
                key="step3"
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.4 }}
                className="space-y-8"
              >
                <div className="text-center">
                  <span className="font-mono text-[10px] uppercase tracking-widest text-caramel block mb-4">
                    CO VŠECHNO ŘEŠÍME
                  </span>
                  <h2 className="font-display font-black text-moonlight text-3xl md:text-5xl mb-3">
                    Co všechno chcete?
                  </h2>
                  <p className="text-sepia/70 text-sm">
                    Vyberte cokoli relevantního — i to, co Vám teď nepřijde nutné. Často spolu věci dávají smysl.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {WANTS_OPTIONS.map((opt) => {
                    const selected = answers.wants.includes(opt.id);
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => toggleWant(opt.id)}
                        className={`p-4 text-left text-sm border transition-all flex items-center justify-between gap-3 ${
                          selected
                            ? "bg-caramel/10 border-caramel text-moonlight"
                            : "bg-coffee border-tobacco text-sepia hover:border-caramel/40 hover:text-moonlight"
                        }`}
                      >
                        <span className="font-medium">{opt.label}</span>
                        <span
                          className={`shrink-0 w-5 h-5 border flex items-center justify-center transition-colors ${
                            selected ? "bg-caramel border-caramel" : "border-tobacco"
                          }`}
                        >
                          {selected && <Check size={12} className="text-espresso" strokeWidth={3} />}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <div className="flex items-center justify-between pt-4">
                  <button
                    onClick={() => setStep(2)}
                    className="text-sandstone/60 font-mono text-[10px] uppercase tracking-widest hover:text-caramel transition-colors flex items-center gap-1"
                  >
                    <ArrowLeft size={10} /> Zpět
                  </button>
                  <span className="font-mono text-[10px] uppercase tracking-widest text-sandstone">
                    Vybráno: <span className="text-caramel">{answers.wants.length}</span>
                  </span>
                  <button
                    onClick={() => setStep(4)}
                    disabled={answers.wants.length === 0}
                    className="bg-caramel text-espresso px-6 py-3 font-mono text-xs uppercase tracking-widest font-bold hover:bg-caramel-light transition-all disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center gap-2"
                  >
                    Pokračovat <ArrowRight size={12} />
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 4: Budget */}
            {step === 4 && (
              <motion.div
                key="step4"
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.4 }}
                className="space-y-8"
              >
                <div className="text-center">
                  <span className="font-mono text-[10px] uppercase tracking-widest text-caramel block mb-4">
                    ROZSAH PŘÍPADU
                  </span>
                  <h2 className="font-display font-black text-moonlight text-3xl md:text-5xl mb-3">
                    Jaký je rozpočet?
                  </h2>
                  <p className="text-sepia/70 text-sm max-w-md mx-auto">
                    Pomáhá nám pochopit, jestli Vám můžeme dát smysluplný návrh. Žádný závazek — orientace.
                  </p>
                </div>

                <div className="space-y-3">
                  {BUDGET_OPTIONS.map((opt) => {
                    const selected = answers.budget === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => selectCard("budget", opt.id, 5)}
                        className={`w-full p-5 text-left border transition-all flex items-center justify-between gap-4 ${
                          selected
                            ? "bg-caramel/10 border-caramel"
                            : "bg-coffee border-tobacco hover:border-caramel/40"
                        }`}
                      >
                        <div>
                          <div className="text-moonlight font-medium">{opt.label}</div>
                          <div className="text-sandstone text-xs mt-1">{opt.hint}</div>
                        </div>
                        <ArrowRight size={14} className="text-caramel/60 shrink-0" />
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() => setStep(3)}
                  className="text-sandstone/50 font-mono text-[10px] uppercase tracking-widest hover:text-caramel transition-colors flex items-center gap-1 mx-auto"
                >
                  <ArrowLeft size={10} /> Zpět
                </button>
              </motion.div>
            )}

            {/* STEP 5: Důkazy (kontaktní údaje) */}
            {step === 5 && (
              <motion.div
                key="step5"
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.4 }}
                className="space-y-8"
              >
                <div className="text-center">
                  <span className="font-mono text-[10px] uppercase tracking-widest text-caramel block mb-4">
                    DŮKAZY
                  </span>
                  <h2 className="font-display font-black text-moonlight text-3xl md:text-4xl mb-2">
                    Skoro hotovo.
                  </h2>
                  <p className="text-sepia/70 text-sm">
                    Ještě pár údajů a Váš případ předáme detektivovi.
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="font-mono text-[10px] uppercase tracking-widest text-sandstone block mb-2">Jméno *</label>
                    <input
                      value={answers.name}
                      onChange={(e) => setAnswers((p) => ({ ...p, name: e.target.value }))}
                      className="w-full bg-coffee border border-tobacco px-4 py-3 text-moonlight placeholder:text-sandstone/50 focus:border-caramel focus:outline-none transition-colors"
                      placeholder="Jan Novák"
                    />
                  </div>
                  <div>
                    <label className="font-mono text-[10px] uppercase tracking-widest text-sandstone block mb-2">E-mail *</label>
                    <input
                      value={answers.email}
                      onChange={(e) => setAnswers((p) => ({ ...p, email: e.target.value }))}
                      type="email"
                      className="w-full bg-coffee border border-tobacco px-4 py-3 text-moonlight placeholder:text-sandstone/50 focus:border-caramel focus:outline-none transition-colors"
                      placeholder="jan@firma.cz"
                    />
                  </div>
                  <div>
                    <label className="font-mono text-[10px] uppercase tracking-widest text-sandstone block mb-2">Telefon</label>
                    <input
                      value={answers.phone}
                      onChange={(e) => setAnswers((p) => ({ ...p, phone: e.target.value }))}
                      type="tel"
                      className="w-full bg-coffee border border-tobacco px-4 py-3 text-moonlight placeholder:text-sandstone/50 focus:border-caramel focus:outline-none transition-colors"
                      placeholder="+420 123 456 789"
                    />
                  </div>
                  {config.showUrl && (
                    <div>
                      <label className="font-mono text-[10px] uppercase tracking-widest text-sandstone block mb-2">URL webu</label>
                      <input
                        value={answers.url}
                        onChange={(e) => setAnswers((p) => ({ ...p, url: e.target.value }))}
                        type="url"
                        className="w-full bg-coffee border border-tobacco px-4 py-3 text-moonlight placeholder:text-sandstone/50 focus:border-caramel focus:outline-none transition-colors"
                        placeholder="https://vasefirma.cz"
                      />
                    </div>
                  )}
                  {config.showPopis && (
                    <div>
                      <label className="font-mono text-[10px] uppercase tracking-widest text-sandstone block mb-2">Popište svůj nápad v jedné větě</label>
                      <textarea
                        value={answers.popis}
                        onChange={(e) => setAnswers((p) => ({ ...p, popis: e.target.value }))}
                        rows={3}
                        className="w-full bg-coffee border border-tobacco px-4 py-3 text-moonlight placeholder:text-sandstone/50 focus:border-caramel focus:outline-none transition-colors resize-none"
                      />
                    </div>
                  )}
                </div>

                <div className="flex flex-col items-center gap-4">
                  <button
                    onClick={handleSubmit}
                    disabled={!answers.name || !answers.email || submitting}
                    className="bg-caramel text-espresso px-10 py-5 font-mono text-xs uppercase tracking-widest font-bold hover:bg-caramel-light transition-all shadow-xl w-full disabled:opacity-50"
                  >
                    {submitting ? "Otevíráme případ..." : "Odeslat případ"}
                  </button>
                  <button
                    onClick={() => setStep(4)}
                    className="text-sandstone/50 font-mono text-[10px] uppercase tracking-widest hover:text-caramel transition-colors flex items-center gap-1"
                  >
                    <ArrowLeft size={10} /> Zpět
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 6: Případ přijat */}
            {step === 6 && (
              <motion.div
                key="step6"
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.4 }}
                className="text-center space-y-8"
              >
                <motion.div
                  initial={{ scale: 3, opacity: 0, rotate: -20 }}
                  animate={{ scale: 1, opacity: 1, rotate: -6 }}
                  transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
                  className="inline-block border-4 border-olive px-8 py-4 -rotate-6"
                >
                  <span className="font-mono text-2xl md:text-4xl uppercase tracking-widest text-olive font-bold">
                    Případ přijat
                  </span>
                </motion.div>

                <div className="space-y-4">
                  <p className="text-moonlight text-lg">
                    Děkujeme, <span className="text-caramel">{answers.name}</span>.
                  </p>
                  <p className="text-sepia/80">
                    Váš případ jsme otevřeli pod číslem{" "}
                    <span className="font-mono text-caramel">{caseNumber}</span>.
                    Ozveme se do 24 hodin.
                  </p>
                  {config.successExtra && (
                    <p className="text-sepia/60 text-sm">{config.successExtra}</p>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                  <Link
                    href="/pripady"
                    className="border border-caramel/30 text-caramel px-8 py-4 font-mono text-xs uppercase tracking-widest hover:bg-caramel/10 transition-all inline-flex items-center gap-2 justify-center"
                  >
                    Vyřešené případy <ArrowRight size={14} />
                  </Link>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
