import { redirect } from 'next/navigation';
import { Eye } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { enterPreview } from '@/lib/actions/preview';
import InviteRequestForm from './InviteRequestForm';

async function loginAction(formData: FormData) {
  'use server';
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');
  const next = sanitizeNext(String(formData.get('next') ?? ''));

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    const params = new URLSearchParams({ error: error.message, next });
    redirect(`/portal/login?${params.toString()}`);
  }
  redirect(next);
}

function sanitizeNext(raw: string): string {
  if (!raw.startsWith('/portal') || raw.startsWith('/portal/login')) {
    return '/portal/dashboard';
  }
  return raw;
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const { next = '/portal/dashboard', error } = await searchParams;
  const safeNext = sanitizeNext(next);

  return (
    <main className="min-h-screen bg-espresso flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        <div className="mb-10 text-center">
          <div className="font-display italic font-black text-moonlight text-4xl tracking-tight">ARBIQ</div>
          <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-sandstone mt-2">
            Klientská zóna
          </div>
        </div>

        <form action={loginAction} className="bg-coffee p-8 space-y-6">
          <input type="hidden" name="next" value={safeNext} />

          <div>
            <label htmlFor="email" className="font-mono text-[10px] uppercase tracking-widest text-sandstone block mb-2">
              E-mail
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="w-full bg-espresso border border-tobacco px-4 py-3 text-moonlight focus:border-caramel focus:outline-none transition-colors"
            />
          </div>

          <div>
            <label htmlFor="password" className="font-mono text-[10px] uppercase tracking-widest text-sandstone block mb-2">
              Heslo
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className="w-full bg-espresso border border-tobacco px-4 py-3 text-moonlight focus:border-caramel focus:outline-none transition-colors"
            />
          </div>

          {error && (
            <p className="text-rust text-sm font-mono">{error}</p>
          )}

          <button
            type="submit"
            className="w-full bg-caramel text-espresso px-6 py-4 font-mono text-xs uppercase tracking-widest font-bold hover:bg-caramel-light transition-all"
          >
            Přihlásit se
          </button>

        </form>

        <form action={enterPreview} className="mt-3">
          <button
            type="submit"
            className="w-full inline-flex items-center justify-center gap-2 bg-rust/15 border border-rust/40 text-rust hover:bg-rust/25 px-6 py-3 font-mono text-[11px] uppercase tracking-widest font-bold transition-all"
            title="Provizorní vstup pro náhled — bez reálných dat"
          >
            <Eye size={14} />
            Vstoupit do náhledu (bez loginu)
          </button>
        </form>

        <div className="mt-6">
          <InviteRequestForm />
        </div>

        <p className="text-sandstone/60 text-xs text-center mt-6">
          Přístup vytváří pouze administrátor. Případně napište na{' '}
          <a href="mailto:bartolomej@arbey.cz" className="text-caramel hover:text-caramel-light">
            bartolomej@arbey.cz
          </a>
          .
        </p>
      </div>
    </main>
  );
}
