'use client';

import { useState, useTransition } from 'react';
import { updateProfile, changePassword } from '@/lib/actions/profile';

type ProfileShape = {
  full_name: string;
  email: string;
  phone: string | null;
  company: string | null;
  ico: string | null;
  website_url: string | null;
  email_notifications_enabled: boolean;
};

const labelClass = 'font-mono text-[10px] uppercase tracking-widest text-sandstone block mb-2';
const inputClass =
  'w-full bg-coffee border border-tobacco px-4 py-3 text-moonlight placeholder:text-sandstone/50 focus:border-caramel focus:outline-none transition-colors';

export default function SettingsForm({ profile }: { profile: ProfileShape }) {
  const [profileState, setProfileState] = useState<{ kind: 'idle' | 'ok' | 'err'; message?: string }>({ kind: 'idle' });
  const [pwState, setPwState] = useState<{ kind: 'idle' | 'ok' | 'err'; message?: string }>({ kind: 'idle' });
  const [profilePending, profileTransition] = useTransition();
  const [pwPending, pwTransition] = useTransition();

  function onProfileSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    profileTransition(async () => {
      const res = await updateProfile(fd);
      setProfileState(res.ok ? { kind: 'ok', message: 'Uloženo.' } : { kind: 'err', message: res.error });
    });
  }

  function onPasswordSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    pwTransition(async () => {
      const res = await changePassword(fd);
      if (res.ok) {
        form.reset();
        setPwState({ kind: 'ok', message: 'Heslo změněno.' });
      } else {
        setPwState({ kind: 'err', message: res.error });
      }
    });
  }

  return (
    <div className="space-y-12">
      <form onSubmit={onProfileSubmit} className="bg-coffee p-8 space-y-5">
        <h2 className="font-display italic font-black text-xl text-moonlight mb-2">Kontaktní údaje</h2>

        <div>
          <label className={labelClass} htmlFor="full_name">Jméno</label>
          <input id="full_name" name="full_name" defaultValue={profile.full_name} required minLength={2} className={inputClass} />
        </div>

        <div>
          <label className={labelClass} htmlFor="email">E-mail</label>
          <input id="email" name="email" defaultValue={profile.email} disabled className={`${inputClass} opacity-60 cursor-not-allowed`} />
          <p className="text-sandstone text-xs mt-1">Pro změnu e-mailu nás kontaktujte.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelClass} htmlFor="phone">Telefon</label>
            <input id="phone" name="phone" defaultValue={profile.phone ?? ''} className={inputClass} />
          </div>
          <div>
            <label className={labelClass} htmlFor="ico">IČO</label>
            <input id="ico" name="ico" defaultValue={profile.ico ?? ''} className={inputClass} />
          </div>
        </div>

        <div>
          <label className={labelClass} htmlFor="company">Firma</label>
          <input id="company" name="company" defaultValue={profile.company ?? ''} className={inputClass} />
        </div>

        <div>
          <label className={labelClass} htmlFor="website_url">Web</label>
          <input id="website_url" name="website_url" defaultValue={profile.website_url ?? ''} className={inputClass} />
        </div>

        <div className="flex items-center gap-3 pt-2">
          <input
            id="email_notifications_enabled"
            name="email_notifications_enabled"
            type="checkbox"
            defaultChecked={profile.email_notifications_enabled}
            className="w-4 h-4 accent-caramel"
          />
          <label htmlFor="email_notifications_enabled" className="text-sepia text-sm">
            Posílat mi e-mailové notifikace o zprávách, fakturách a doporučeních.
          </label>
        </div>

        {profileState.kind === 'ok' && <p className="text-olive text-sm font-mono">{profileState.message}</p>}
        {profileState.kind === 'err' && <p className="text-rust text-sm font-mono">{profileState.message}</p>}

        <button
          type="submit"
          disabled={profilePending}
          className="bg-caramel text-espresso px-6 py-3 font-mono text-xs uppercase tracking-widest font-bold hover:bg-caramel-light transition-all disabled:opacity-50"
        >
          {profilePending ? 'Ukládám…' : 'Uložit změny'}
        </button>
      </form>

      <form onSubmit={onPasswordSubmit} className="bg-coffee p-8 space-y-5">
        <h2 className="font-display italic font-black text-xl text-moonlight mb-2">Změna hesla</h2>

        <div>
          <label className={labelClass} htmlFor="password">Nové heslo</label>
          <input id="password" name="password" type="password" required minLength={8} autoComplete="new-password" className={inputClass} />
        </div>

        <div>
          <label className={labelClass} htmlFor="confirm">Potvrzení hesla</label>
          <input id="confirm" name="confirm" type="password" required minLength={8} autoComplete="new-password" className={inputClass} />
        </div>

        {pwState.kind === 'ok' && <p className="text-olive text-sm font-mono">{pwState.message}</p>}
        {pwState.kind === 'err' && <p className="text-rust text-sm font-mono">{pwState.message}</p>}

        <button
          type="submit"
          disabled={pwPending}
          className="bg-caramel text-espresso px-6 py-3 font-mono text-xs uppercase tracking-widest font-bold hover:bg-caramel-light transition-all disabled:opacity-50"
        >
          {pwPending ? 'Měním…' : 'Změnit heslo'}
        </button>
      </form>
    </div>
  );
}
