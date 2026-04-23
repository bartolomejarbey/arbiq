"use client";

import { useState, use } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { kampanData, velikostOptions, type KampanKey } from "@/lib/kampan-data";

type Answers = {
  obor: string;
  velikost: string;
  step3: string;
  name: string;
  email: string;
  phone: string;
  url: string;
  popis: string;
};

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
    step3: "",
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

  const totalSteps = 5;
  const progress = (step / totalSteps) * 100;

  function selectCard(field: keyof Answers, value: string, nextStep: number) {
    setAnswers((prev) => ({ ...prev, [field]: value }));
    setTimeout(() => setStep(nextStep), 300);
  }

  async function handleSubmit() {
    if (!answers.name || !answers.email) return;
    setSubmitting(true);
    let num = "#" + String(Math.floor(Math.random() * 9000) + 1000);
    try {
      const res = await fetch("/api/pripad", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kampan,
          ...answers,
          utm_source: new URLSearchParams(window.location.search).get("utm_source") || "",
          utm_medium: new URLSearchParams(window.location.search).get("utm_medium") || "",
          utm_campaign: new URLSearchParams(window.location.search).get("utm_campaign") || "",
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
    setStep(5);
  }

  const slideVariants = {
    enter: { x: 80, opacity: 0 },
    center: { x: 0, opacity: 1 },
    exit: { x: -80, opacity: 0 },
  };

  return (
    <div className="min-h-screen bg-espresso relative flex flex-col">
      {/* Progress bar */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-espresso/90 backdrop-blur-sm px-6 py-4">
        <div className="max-w-xl mx-auto">
          <div className="flex items-center justify-between mb-2">
            <span className="font-mono text-[10px] uppercase tracking-widest text-sandstone">
              Vyšetřování
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
      <div className="flex-1 flex items-center justify-center px-6 pt-20 pb-12">
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

            {/* STEP 2: Identifikace */}
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

            {/* STEP 3: Předběžné vyšetřování */}
            {step === 3 && (
              <motion.div
                key="step3"
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.4 }}
                className="space-y-10"
              >
                <div className="text-center">
                  <span className="font-mono text-[10px] uppercase tracking-widest text-caramel block mb-4">
                    PŘEDBĚŽNÉ VYŠETŘOVÁNÍ
                  </span>
                  <h2 className="font-display font-black text-moonlight text-3xl md:text-5xl">
                    {config.step3Question}
                  </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {config.step3Options.map((opt) => (
                    <button
                      key={opt}
                      onClick={() => selectCard("step3", opt, 4)}
                      className="bg-coffee border border-tobacco p-5 text-left text-moonlight hover:border-caramel hover:bg-caramel/5 transition-all font-medium"
                    >
                      {opt}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setStep(2)}
                  className="text-sandstone/50 font-mono text-[10px] uppercase tracking-widest hover:text-caramel transition-colors flex items-center gap-1 mx-auto"
                >
                  <ArrowLeft size={10} /> Zpět
                </button>
              </motion.div>
            )}

            {/* STEP 4: Důkazy (kontaktní údaje) */}
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
                    onClick={() => setStep(3)}
                    className="text-sandstone/50 font-mono text-[10px] uppercase tracking-widest hover:text-caramel transition-colors flex items-center gap-1"
                  >
                    <ArrowLeft size={10} /> Zpět
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 5: Případ přijat */}
            {step === 5 && (
              <motion.div
                key="step5"
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.4 }}
                className="text-center space-y-8"
              >
                {/* Razítko */}
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
                  <Link
                    href="/rentgen"
                    className="bg-caramel text-espresso px-8 py-4 font-mono text-xs uppercase tracking-widest font-bold hover:bg-caramel-light transition-all inline-flex items-center gap-2 justify-center"
                  >
                    Objednat Rentgen <ArrowRight size={14} />
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
