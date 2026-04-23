"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import DetectiveTag from "@/components/shared/DetectiveTag";
import Typewriter from "@/components/shared/Typewriter";
import { Mail, Phone, MapPin, Building, Clock, CheckCircle, Search, Calendar, MessageSquare, ArrowRight } from "lucide-react";

const contactSchema = z.object({
  name: z.string().min(2, "Jméno je povinné"),
  email: z.string().email("Neplatný e-mail"),
  phone: z.string().min(9, "Neplatné telefonní číslo"),
  type: z.string().min(1, "Vyberte typ poptávky"),
  message: z.string().min(10, "Zpráva musí mít alespoň 10 znaků"),
});

type ContactFormData = z.infer<typeof contactSchema>;

export default function KontaktPage() {
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
  });

  function openKonzultace(e: React.MouseEvent<HTMLAnchorElement>) {
    e.preventDefault();
    setValue("type", "konzultace", { shouldValidate: true });
    document.getElementById("formular")?.scrollIntoView({ behavior: "smooth" });
  }

  const onSubmit = async (data: ContactFormData) => {
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await fetch("/api/kontakt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const payload = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(payload.error ?? "Něco se pokazilo.");
      }
      setSubmitted(true);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Něco se pokazilo.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="pt-32 pb-24 px-6 md:px-12">
      <div className="max-w-7xl mx-auto">
        <div className="mb-20">
          <DetectiveTag className="mb-4">KANCELÁŘ DETEKTIVA</DetectiveTag>
          <h1 className="font-display font-black text-moonlight text-4xl md:text-6xl lg:text-7xl mb-6">
            Máte případ?
          </h1>
          <p className="text-sepia/70 max-w-2xl text-lg">
            <Typewriter text="Odpovídáme do 24 hodin." />
          </p>
        </div>

        {/* 3 vstupní body */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-20">
          <Link href="/rentgen" className="group bg-coffee border border-tobacco p-8 hover:border-caramel/40 transition-all">
            <Search size={28} className="text-caramel mb-4" strokeWidth={1.5} />
            <h3 className="font-display font-bold text-xl text-moonlight mb-2 group-hover:text-caramel transition-colors">Rentgen</h3>
            <p className="text-sepia/70 text-sm mb-4">Hodinový audit za 1 500 Kč. Pokud nebudete spokojeni, neplatíte.</p>
            <span className="font-mono text-[11px] uppercase tracking-widest text-caramel/70 inline-flex items-center gap-1">Objednat <ArrowRight size={12} /></span>
          </Link>
          <a href="#formular" onClick={openKonzultace} className="group bg-coffee border border-tobacco p-8 hover:border-caramel/40 transition-all">
            <Calendar size={28} className="text-caramel mb-4" strokeWidth={1.5} />
            <h3 className="font-display font-bold text-xl text-moonlight mb-2 group-hover:text-caramel transition-colors">Schůzka</h3>
            <p className="text-sepia/70 text-sm mb-4">30 minut online. Řekneme si, jestli si sedíme.</p>
            <span className="font-mono text-[11px] uppercase tracking-widest text-caramel/70 inline-flex items-center gap-1">Otevřít konzultaci <ArrowRight size={12} /></span>
          </a>
          <a href="#formular" className="group bg-coffee border border-tobacco p-8 hover:border-caramel/40 transition-all">
            <MessageSquare size={28} className="text-caramel mb-4" strokeWidth={1.5} />
            <h3 className="font-display font-bold text-xl text-moonlight mb-2 group-hover:text-caramel transition-colors">Rychlá zpráva</h3>
            <p className="text-sepia/70 text-sm mb-4">Napište nám co Vás trápí. Bez formálností.</p>
            <span className="font-mono text-[11px] uppercase tracking-widest text-caramel/70 inline-flex items-center gap-1">Napsat <ArrowRight size={12} /></span>
          </a>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          {/* Levý sloupec - kontaktní info */}
          <div className="space-y-10">
            <div>
              <h2 className="font-display text-2xl text-moonlight mb-8">
                Detektivní kancelář
              </h2>

              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <Mail size={20} className="text-caramel mt-1 shrink-0" strokeWidth={1.5} />
                  <div>
                    <span className="font-mono text-[10px] uppercase tracking-widest text-sandstone block mb-1">E-mail</span>
                    <a href="mailto:info@arbiq.cz" className="text-moonlight hover:text-caramel transition-colors">info@arbiq.cz</a>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <Phone size={20} className="text-caramel mt-1 shrink-0" strokeWidth={1.5} />
                  <div>
                    <span className="font-mono text-[10px] uppercase tracking-widest text-sandstone block mb-1">Telefon</span>
                    <a href="tel:+420725932729" className="text-moonlight hover:text-caramel transition-colors">+420 725 932 729</a>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <MapPin size={20} className="text-caramel mt-1 shrink-0" strokeWidth={1.5} />
                  <div>
                    <span className="font-mono text-[10px] uppercase tracking-widest text-sandstone block mb-1">Adresa</span>
                    <p className="text-moonlight">Praha 1</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <Building size={20} className="text-caramel mt-1 shrink-0" strokeWidth={1.5} />
                  <div>
                    <span className="font-mono text-[10px] uppercase tracking-widest text-sandstone block mb-1">Fakturační údaje</span>
                    <p className="text-moonlight">Harotas s.r.o.</p>
                    <p className="text-sepia/60 text-sm">IČO: 21402027</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <Clock size={20} className="text-caramel mt-1 shrink-0" strokeWidth={1.5} />
                  <div>
                    <span className="font-mono text-[10px] uppercase tracking-widest text-sandstone block mb-1">Úřední hodiny</span>
                    <p className="text-moonlight">Po–Pá: 9:00–18:00</p>
                    <p className="text-sepia/60 text-sm">Odpovídáme do 24 hodin</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-coffee border border-tobacco p-8 -rotate-[1deg]">
              <span className="font-mono text-[10px] uppercase tracking-widest text-caramel block mb-3">POZNÁMKA DETEKTIVA</span>
              <p className="text-sepia/80 font-serif-alt leading-relaxed">
                &ldquo;Nejlepší případ je ten, který začíná jedním upřímným e-mailem. Žádné formality, žádné RFP dokumenty. Napište nám, co Vás trápí — a my Vám řekneme, jestli to umíme vyřešit.&rdquo;
              </p>
            </div>
          </div>

          {/* Pravý sloupec - formulář */}
          <div id="formular">
            <h2 className="font-display text-2xl text-moonlight mb-8">
              Otevřít případ
            </h2>

            {submitted ? (
              <div className="bg-coffee border-2 border-olive p-12 text-center">
                <CheckCircle size={48} className="text-olive mx-auto mb-4" />
                <h3 className="font-display text-3xl text-moonlight mb-4">
                  Zpráva odeslána
                </h3>
                <p className="text-sepia/80 mb-2">
                  Děkujeme. Ozveme se do 24 hodin.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div>
                  <label className="font-mono text-[10px] uppercase tracking-widest text-sandstone block mb-2">Jméno *</label>
                  <input
                    {...register("name")}
                    className="w-full bg-coffee border border-tobacco px-4 py-3 text-moonlight placeholder:text-sandstone/50 focus:border-caramel focus:outline-none transition-colors"
                    placeholder="Jan Novák"
                  />
                  {errors.name && <p className="text-rust text-xs mt-1">{errors.name.message}</p>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                  <div>
                    <label className="font-mono text-[10px] uppercase tracking-widest text-sandstone block mb-2">Telefon *</label>
                    <input
                      {...register("phone")}
                      type="tel"
                      className="w-full bg-coffee border border-tobacco px-4 py-3 text-moonlight placeholder:text-sandstone/50 focus:border-caramel focus:outline-none transition-colors"
                      placeholder="+420 123 456 789"
                    />
                    {errors.phone && <p className="text-rust text-xs mt-1">{errors.phone.message}</p>}
                  </div>
                </div>

                <div>
                  <label className="font-mono text-[10px] uppercase tracking-widest text-sandstone block mb-2">Typ poptávky *</label>
                  <select
                    {...register("type")}
                    className="w-full bg-coffee border border-tobacco px-4 py-3 text-moonlight focus:border-caramel focus:outline-none transition-colors appearance-none"
                    defaultValue=""
                  >
                    <option value="" disabled>Vyberte typ...</option>
                    <option value="obecna">Obecná poptávka</option>
                    <option value="projekt">Projekt (web, aplikace)</option>
                    <option value="konzultace">Konzultace</option>
                    <option value="produkt">Produkt (SaaS nástroj)</option>
                  </select>
                  {errors.type && <p className="text-rust text-xs mt-1">{errors.type.message}</p>}
                </div>

                <div>
                  <label className="font-mono text-[10px] uppercase tracking-widest text-sandstone block mb-2">Zpráva *</label>
                  <textarea
                    {...register("message")}
                    rows={5}
                    className="w-full bg-coffee border border-tobacco px-4 py-3 text-moonlight placeholder:text-sandstone/50 focus:border-caramel focus:outline-none transition-colors resize-none"
                    placeholder="Popište nám Váš případ..."
                  />
                  {errors.message && <p className="text-rust text-xs mt-1">{errors.message.message}</p>}
                </div>

                {submitError && (
                  <p className="text-rust text-sm font-mono">{submitError}</p>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-caramel text-espresso px-10 py-5 font-mono text-xs uppercase tracking-widest font-bold hover:bg-caramel-light transition-all shadow-2xl w-full disabled:opacity-50 disabled:cursor-wait"
                >
                  {submitting ? "Odesílám..." : "Odeslat zprávu"}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
