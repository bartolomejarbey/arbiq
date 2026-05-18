"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import DetectiveTag from "@/components/shared/DetectiveTag";
import MarkerUnderline from "@/components/shared/MarkerUnderline";
import WaxSeal from "@/components/shared/WaxSeal";
import Honeypot from "@/components/shared/Honeypot";
import { track } from "@/lib/track";
import { Search, FileText, Phone, ChevronDown, ChevronUp, CheckCircle, ArrowDown } from "lucide-react";

const findings = [
  { number: "01", text: "Chybějící nebo špatně nastavené měření — nevíte, co funguje" },
  { number: "02", text: "Neoptimalizované SEO — Google Vás neukazuje" },
  { number: "03", text: "Pomalé načítání — 40 % návštěvníků odchází" },
  { number: "04", text: "Chybějící call-to-action — lidé nevědí, co udělat dál" },
  { number: "05", text: "Nesrozumitelná nabídka — nikdo netuší, co prodáváte" },
  { number: "06", text: "Špatně nastavené reklamy — peníze odcházejí bez výsledků" },
  { number: "07", text: "Bezpečnostní díry — hrozí napadení webu" },
  { number: "08", text: "Chybějící GDPR — hrozí pokuta" },
];

const steps = [
  { number: "01", title: "Objednáte", icon: CheckCircle, description: "Vyplníte formulář, pošlete přístupy." },
  { number: "02", title: "Vyšetřujeme", icon: Search, description: "60 minut hluboké analýzy." },
  { number: "03", title: "Verdikt", icon: FileText, description: "Písemný report do 5 pracovních dnů." },
  { number: "04", title: "Konzultace", icon: Phone, description: "30minutový hovor kde projdeme report." },
];

const faqs = [
  { q: "Co když nenajdete žádný problém?", a: "Gratulujeme a vrátíme peníze." },
  { q: "Je to opravdu jen 1 500 Kč?", a: "Ano. Chceme abyste zjistili co umíme." },
  { q: "Co když si pak u Vás něco objednám?", a: "Cena se odečte z první faktury." },
  { q: "Jak dlouho to trvá?", a: "Report do 5 pracovních dnů." },
  { q: "Komu to pomůže nejvíc?", a: "Podnikatelům co mají web a marketing ale necítí výsledky." },
  { q: "Kdo to dělá?", a: "Bartoloměj Rota osobně nebo proškolený analytik." },
];

const formSchema = z.object({
  name: z.string().min(2, "Jméno je povinné"),
  email: z.string().email("Neplatný e-mail"),
  phone: z.string().optional(),
  company: z.string().optional(),
  url: z.string().min(1, "URL webu je povinná"),
  description: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

export default function RentgenPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(formSchema),
  });

  const onSubmit = async (data: FormData) => {
    setSubmitting(true);
    setSubmitError(null);
    try {
      const params = new URLSearchParams(window.location.search);
      const hp = (document.getElementById("website_url_hp") as HTMLInputElement | null)?.value ?? "";
      const res = await fetch("/api/rentgen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          utm_source: params.get("utm_source") ?? "",
          utm_medium: params.get("utm_medium") ?? "",
          utm_campaign: params.get("utm_campaign") ?? "",
          website_url_hp: hp,
        }),
      });
      const payload = (await res.json().catch(() => ({}))) as { orderId?: string; error?: string };
      if (!res.ok) {
        throw new Error(payload.error ?? "Něco se pokazilo. Zkuste znovu nebo napište na info@arbiq.cz");
      }
      setOrderId(payload.orderId ?? null);
      setSubmitted(true);
      track('rentgen_submit', { orderId: payload.orderId ?? null });
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Něco se pokazilo.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="pt-32">
      {/* HERO */}
      <section className="pb-24 px-6 md:px-12">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          <div>
            <DetectiveTag className="mb-8">FLAGSHIP SLUŽBA</DetectiveTag>
            <h1 className="font-display font-black text-moonlight text-5xl md:text-7xl lg:text-8xl leading-[0.9] mb-8">
              <MarkerUnderline>Rentgen</MarkerUnderline> Vašeho podnikání
            </h1>

            <div className="mb-8">
              <div className="font-display font-black text-5xl md:text-6xl text-caramel mb-2">1 500 Kč</div>
              <p className="font-mono text-[11px] uppercase tracking-widest text-sandstone">/ hodina</p>
              <p className="text-sepia/70 text-sm mt-2">
                S odečtem z první faktury pokud se rozhodneme spolupracovat.
              </p>
            </div>

            <div className="flex flex-wrap gap-4">
              <a
                href="#objednat"
                className="bg-caramel text-espresso px-8 py-4 font-mono text-xs uppercase tracking-widest font-bold hover:bg-caramel-light transition-all shadow-xl inline-block"
              >
                Objednat Rentgen
              </a>
              <a
                href="#co-odhalime"
                className="border border-caramel/30 text-caramel px-8 py-4 font-mono text-xs uppercase tracking-widest hover:bg-caramel/10 transition-all inline-flex items-center gap-2"
              >
                Co odhalíme? <ArrowDown size={14} />
              </a>
            </div>
          </div>

          {/* Right: illustration placeholder */}
          <div className="hidden lg:flex items-center justify-center">
            <div className="w-80 h-96 bg-coffee border border-tobacco flex items-center justify-center rotate-2 shadow-2xl">
              <span className="font-mono text-[10px] uppercase tracking-widest text-sandstone/40 text-center px-4">
                Ilustrace<br />Rentgen
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* CO RENTGEN ODHALÍ */}
      <section id="co-odhalime" className="py-24 bg-coffee">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <DetectiveTag className="mb-4">NÁLEZY</DetectiveTag>
          <h2 className="font-display font-black text-moonlight text-4xl md:text-5xl mb-16">
            Co Rentgen odhalí
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {findings.map((f) => (
              <div key={f.number} className="flex items-start gap-6 bg-espresso border border-tobacco p-6 hover:border-caramel/40 transition-all">
                <span className="font-mono text-3xl text-caramel/30 font-bold shrink-0">{f.number}</span>
                <p className="text-sepia/80 text-sm leading-relaxed pt-1">{f.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* JAK TO PROBÍHÁ */}
      <section className="bg-parchment text-espresso-text paper-texture py-24 md:py-32">
        <div className="max-w-5xl mx-auto px-6 md:px-12">
          <div className="text-center mb-16">
            <DetectiveTag variant="light" className="mb-4">PRŮBĚH VYŠETŘOVÁNÍ</DetectiveTag>
            <h2 className="font-display font-black text-espresso-text text-4xl md:text-5xl">
              Jak to probíhá
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {steps.map((s) => {
              const Icon = s.icon;
              return (
                <div key={s.number} className="text-center">
                  <div className="w-16 h-16 rounded-full bg-espresso-text/10 flex items-center justify-center mx-auto mb-4">
                    <Icon size={28} className="text-espresso-text/60" strokeWidth={1.5} />
                  </div>
                  <span className="font-mono text-[10px] uppercase tracking-widest text-brown-muted block mb-2">
                    KROK {s.number}
                  </span>
                  <h3 className="font-display text-xl text-espresso-text mb-2">{s.title}</h3>
                  <p className="text-sm text-brown-muted leading-relaxed">{s.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 3 SCÉNÁŘE */}
      <section className="py-24 bg-espresso">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <DetectiveTag className="mb-4">TŘI SCÉNÁŘE</DetectiveTag>
          <h2 className="font-display font-black text-moonlight text-4xl md:text-5xl mb-16">
            Co se stane po Rentgenu?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-coffee border border-tobacco p-8">
              <h3 className="font-display font-bold text-xl text-moonlight mb-3">Nespokojeni? Neplatíte.</h3>
              <p className="text-sm text-sepia/80 leading-relaxed mb-6">Pokud Vám Rentgen nepřinesl žádnou hodnotu, nechceme Vaše peníze. Tlapku na to.</p>
              <div className="font-display font-black text-4xl text-caramel">0 Kč</div>
            </div>
            <div className="bg-coffee border border-tobacco p-8">
              <h3 className="font-display font-bold text-xl text-moonlight mb-3">Spokojeni, ale každý jde svou cestou?</h3>
              <p className="text-sm text-sepia/80 leading-relaxed mb-6">Dostanete report, doporučení a naše číslo pro případ, že si to rozmyslíte.</p>
              <div className="font-display font-black text-4xl text-moonlight">1 500 Kč</div>
            </div>
            <div className="bg-coffee border border-tobacco p-8">
              <h3 className="font-display font-bold text-xl text-moonlight mb-3">Spolupracujeme? Rentgen zdarma.</h3>
              <p className="text-sm text-sepia/80 leading-relaxed mb-6">Bereme ho jako investici do vztahu — a my investujeme rádi.</p>
              <div className="font-display font-black text-4xl text-caramel">0 Kč</div>
              <p className="font-mono text-[10px] text-sandstone uppercase tracking-widest mt-2">(odečteno z první faktury)</p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-24 bg-coffee">
        <div className="max-w-3xl mx-auto px-6 md:px-12">
          <DetectiveTag className="mb-4">VÝSLECH</DetectiveTag>
          <h2 className="font-display font-black text-moonlight text-4xl md:text-5xl mb-12">
            Časté otázky
          </h2>
          <div className="space-y-2">
            {faqs.map((faq, i) => {
              const open = openFaq === i;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.4, delay: i * 0.05 }}
                  className={`border transition-colors ${open ? "border-caramel/60 bg-caramel/[0.03]" : "border-tobacco"}`}
                >
                  <button
                    onClick={() => setOpenFaq(open ? null : i)}
                    className="w-full flex justify-between items-center p-6 text-left hover:bg-caramel/5 transition-colors"
                    aria-expanded={open}
                  >
                    <span className="text-moonlight font-medium pr-4">{faq.q}</span>
                    <motion.div
                      animate={{ rotate: open ? 180 : 0 }}
                      transition={{ duration: 0.25, ease: "easeOut" }}
                      className="shrink-0"
                    >
                      <ChevronDown size={18} className="text-caramel" />
                    </motion.div>
                  </button>
                  <AnimatePresence initial={false}>
                    {open && (
                      <motion.div
                        key="content"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                        className="overflow-hidden"
                      >
                        <div className="px-6 pb-6 text-sepia/80 text-sm leading-relaxed border-t border-tobacco pt-4">
                          {faq.a}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* OBJEDNÁVKOVÝ FORMULÁŘ */}
      <section id="objednat" className="py-24 bg-espresso">
        <div className="max-w-3xl mx-auto px-6 md:px-12">
          <div className="flex justify-between items-start mb-12">
            <div>
              <DetectiveTag className="mb-4">OTEVŘÍT PŘÍPAD</DetectiveTag>
              <h2 className="font-display font-black text-moonlight text-4xl md:text-5xl">
                Objednat Rentgen
              </h2>
            </div>
            <WaxSeal text="NOVÝ" subtext="PŘÍPAD" className="hidden md:flex" />
          </div>

          {submitted ? (
            <div className="bg-coffee border-2 border-olive p-12 text-center">
              <CheckCircle size={48} className="text-olive mx-auto mb-4" />
              <h3 className="font-display text-3xl text-moonlight mb-4">
                Případ otevřen
              </h3>
              <p className="text-sepia/80 mb-2">
                Případ byl zaevidován pod číslem{" "}
                <span className="font-mono text-caramel">{orderId ?? "—"}</span>.
              </p>
              <p className="text-sepia/60 text-sm">
                Zkontrolujte e-mail. Ozveme se do 24 hodin.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <Honeypot />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="font-mono text-[10px] uppercase tracking-widest text-sandstone block mb-2">Jméno *</label>
                  <input
                    {...register("name")}
                    className="w-full bg-coffee border border-tobacco px-4 py-3 text-moonlight placeholder:text-sandstone/50 focus:border-caramel focus:outline-none transition-colors"
                    placeholder="Jan Novák"
                  />
                  {errors.name && <p className="text-rust text-xs mt-1">{errors.name.message}</p>}
                </div>
                <div>
                  <label className="font-mono text-[10px] uppercase tracking-widest text-sandstone block mb-2">E-mail *</label>
                  <input
                    {...register("email")}
                    type="email"
                    className="w-full bg-coffee border border-tobacco px-4 py-3 text-moonlight placeholder:text-sandstone/50 focus:border-caramel focus:outline-none transition-colors"
                    placeholder="jan@firma.cz"
                  />
                  {errors.email && <p className="text-rust text-xs mt-1">{errors.email.message}</p>}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="font-mono text-[10px] uppercase tracking-widest text-sandstone block mb-2">Telefon</label>
                  <input
                    {...register("phone")}
                    type="tel"
                    className="w-full bg-coffee border border-tobacco px-4 py-3 text-moonlight placeholder:text-sandstone/50 focus:border-caramel focus:outline-none transition-colors"
                    placeholder="+420 123 456 789"
                  />
                </div>
                <div>
                  <label className="font-mono text-[10px] uppercase tracking-widest text-sandstone block mb-2">Firma</label>
                  <input
                    {...register("company")}
                    className="w-full bg-coffee border border-tobacco px-4 py-3 text-moonlight placeholder:text-sandstone/50 focus:border-caramel focus:outline-none transition-colors"
                    placeholder="Název firmy"
                  />
                </div>
              </div>
              <div>
                <label className="font-mono text-[10px] uppercase tracking-widest text-sandstone block mb-2">URL webu *</label>
                <input
                  {...register("url")}
                  type="url"
                  className="w-full bg-coffee border border-tobacco px-4 py-3 text-moonlight placeholder:text-sandstone/50 focus:border-caramel focus:outline-none transition-colors"
                  placeholder="https://vasefirma.cz"
                />
                {errors.url && <p className="text-rust text-xs mt-1">{errors.url.message}</p>}
              </div>
              <div>
                <label className="font-mono text-[10px] uppercase tracking-widest text-sandstone block mb-2">Popis problému</label>
                <textarea
                  {...register("description")}
                  rows={4}
                  className="w-full bg-coffee border border-tobacco px-4 py-3 text-moonlight placeholder:text-sandstone/50 focus:border-caramel focus:outline-none transition-colors resize-none"
                  placeholder="Co Vás trápí? Co nefunguje? Co jste už zkoušeli?"
                />
              </div>
              {submitError && (
                <p className="text-rust text-sm font-mono">{submitError}</p>
              )}
              <button
                type="submit"
                disabled={submitting}
                className="bg-caramel text-espresso px-10 py-5 font-mono text-xs uppercase tracking-widest font-bold hover:bg-caramel-light transition-all shadow-2xl w-full md:w-auto disabled:opacity-50"
              >
                {submitting ? "Otevíráme případ..." : "Objednat Rentgen za 1 500 Kč"}
              </button>
              <p className="text-sepia/50 text-xs">
                Po odeslání Vám pošleme platební údaje. Pokud nebudete spokojeni s výsledkem, neplatíte nic.
              </p>
            </form>
          )}
        </div>
      </section>
    </div>
  );
}
