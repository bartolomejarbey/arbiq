'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CheckCircle, ArrowRight } from 'lucide-react';
import DetectiveTag from '@/components/shared/DetectiveTag';
import WaxSeal from '@/components/shared/WaxSeal';
import Honeypot from '@/components/shared/Honeypot';
import { track } from '@/lib/track';

const oborOptions = [
  'B2B služby',
  'Profesní poradenství (právo, daně, finance)',
  'Řemesla a stavebnictví',
  'IT a technologie',
  'E-shop',
  'Vzdělávání',
  'Realitní makléři',
  'Zdravotnictví',
  'Jiné',
];

const schema = z.object({
  email: z.string().email('Neplatný e-mail'),
  url: z.string().min(3, 'URL webu je povinná'),
  obor: z.string().min(1, 'Vyberte obor'),
});

type FormData = z.infer<typeof schema>;

export default function FinalCTA() {
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  async function onSubmit(data: FormData) {
    setSubmitting(true);
    setError(null);
    try {
      const params = new URLSearchParams(window.location.search);
      const hp = (document.getElementById('website_url_hp') as HTMLInputElement | null)?.value ?? '';
      const res = await fetch('/api/kontakt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'GEO mini-audit',
          email: data.email,
          message: `Žádost o GEO mini-audit zdarma.\nWeb: ${data.url}\nObor: ${data.obor}`,
          source: 'geo-ai-viditelnost',
          utm_source: params.get('utm_source') ?? '',
          utm_medium: params.get('utm_medium') ?? '',
          utm_campaign: params.get('utm_campaign') ?? '',
          website_url_hp: hp,
        }),
      });
      if (!res.ok) {
        const payload = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(payload.error ?? 'Něco se pokazilo. Zkuste znovu nebo napište na info@arbiq.cz');
      }
      setSubmitted(true);
      track('geo_mini_audit_submit', { obor: data.obor });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Něco se pokazilo.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section id="audit-zdarma" className="py-24 md:py-32 bg-coffee relative overflow-hidden">
      <div className="max-w-5xl mx-auto px-6 md:px-12">
        <div className="bg-espresso border border-caramel/30 p-8 md:p-16 relative">
          <WaxSeal text="ZDARMA" subtext="MINI-AUDIT" className="hidden md:flex absolute -top-8 -right-8" />

          <DetectiveTag className="mb-6">ZAČNĚTE VYŠETŘOVÁNÍ</DetectiveTag>
          <h2 className="font-display font-black text-moonlight text-3xl md:text-5xl leading-tight mb-6">
            Nevíte, kde dnes v AI vyhledávání jste?
          </h2>
          <p className="text-sepia/85 text-base md:text-lg leading-relaxed max-w-2xl mb-10">
            Zdarma Vám položíme pět otázek, které pokládají Vaši zákazníci, do ChatGPT a Perplexity. Pošleme report — kde jste, kde je konkurence, a jestli má smysl tohle řešit. Bez závazku, bez follow-up callu, pokud nechcete.
          </p>

          {submitted ? (
            <div className="bg-coffee border-2 border-olive p-10 text-center">
              <CheckCircle size={40} className="text-olive mx-auto mb-4" />
              <h3 className="font-display text-2xl text-moonlight mb-3">Případ otevřen</h3>
              <p className="text-sepia/80">
                Mini-audit dostanete e-mailem do 3 pracovních dnů. Pokud spěcháte, napište na{' '}
                <a href="mailto:info@arbiq.cz" className="text-caramel hover:text-caramel-light underline">
                  info@arbiq.cz
                </a>.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-2xl">
              <Honeypot />

              <div>
                <label className="font-mono text-[10px] uppercase tracking-widest text-sandstone block mb-2">
                  E-mail *
                </label>
                <input
                  {...register('email')}
                  type="email"
                  placeholder="vy@firma.cz"
                  className="w-full bg-coffee border border-tobacco px-4 py-3 text-moonlight placeholder:text-sandstone/50 focus:border-caramel focus:outline-none transition-colors"
                />
                {errors.email && <p className="text-rust text-xs mt-1">{errors.email.message}</p>}
              </div>

              <div>
                <label className="font-mono text-[10px] uppercase tracking-widest text-sandstone block mb-2">
                  URL Vašeho webu *
                </label>
                <input
                  {...register('url')}
                  type="url"
                  placeholder="https://vasefirma.cz"
                  className="w-full bg-coffee border border-tobacco px-4 py-3 text-moonlight placeholder:text-sandstone/50 focus:border-caramel focus:outline-none transition-colors"
                />
                {errors.url && <p className="text-rust text-xs mt-1">{errors.url.message}</p>}
              </div>

              <div>
                <label className="font-mono text-[10px] uppercase tracking-widest text-sandstone block mb-2">
                  Obor *
                </label>
                <select
                  {...register('obor')}
                  className="w-full bg-coffee border border-tobacco px-4 py-3 text-moonlight focus:border-caramel focus:outline-none transition-colors"
                  defaultValue=""
                >
                  <option value="" disabled>
                    Vyberte obor…
                  </option>
                  {oborOptions.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
                {errors.obor && <p className="text-rust text-xs mt-1">{errors.obor.message}</p>}
              </div>

              {error && <p className="text-rust text-sm font-mono">{error}</p>}

              <div className="flex flex-col sm:flex-row gap-4 pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-caramel text-espresso px-8 py-4 font-mono text-xs uppercase tracking-widest font-bold hover:bg-caramel-light transition-all shadow-xl inline-flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {submitting ? 'Otevíráme případ…' : 'Zahájit vyšetřování'} <ArrowRight size={14} />
                </button>
                <Link
                  href="/rentgen"
                  className="border border-caramel/40 text-caramel px-8 py-4 font-mono text-xs uppercase tracking-widest hover:bg-caramel/10 transition-all inline-flex items-center justify-center gap-2"
                >
                  Chci kompletní AI Rentgen za 2 500 Kč
                </Link>
              </div>

              <p className="text-sandstone text-xs leading-relaxed pt-2">
                Odesláním souhlasíte se zpracováním e-mailu pro účely doručení auditu. Žádný marketing,
                žádné followup hovory bez Vašeho svolení.
              </p>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
