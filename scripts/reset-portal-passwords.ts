/**
 * One-shot skript: resetuje hesla pro Bartoloměje + Fidelia (klientská zóna).
 *
 * Spuštění:
 *   node --env-file=.env.local --experimental-strip-types --no-warnings scripts/reset-portal-passwords.ts
 *
 * Po dobehnutí vypíše nová hesla do stdoutu — ulož si je hned, podruhé se neukážou.
 * Použivá Supabase service-role key, takže obejde RLS i politiky.
 */
import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const admin = createClient(url, serviceKey, { auth: { persistSession: false } });

const ACCOUNTS = [
  { email: 'bartolomej@arbiq.cz', label: 'Bartoloměj Rota (admin)' },
  { email: 'fidelio@arbiq.cz', label: 'Fidelio Seidl (obchodnik)' },
];

function generatePassword(length = 16): string {
  const chars = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789!@#$%';
  let out = '';
  for (let i = 0; i < length; i += 1) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return out;
}

async function main() {
  const { data: list, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
  if (error) {
    console.error('listUsers failed:', error);
    process.exit(1);
  }

  const results: Array<{ label: string; email: string; password?: string; error?: string }> = [];

  for (const acc of ACCOUNTS) {
    const found = list.users.find((u) => u.email?.toLowerCase() === acc.email.toLowerCase());
    if (!found) {
      results.push({ ...acc, error: 'Účet v Supabase Auth neexistuje — vytvoř ho přes Dashboard nebo invite skript.' });
      continue;
    }

    const newPassword = generatePassword();
    const { error: updateErr } = await admin.auth.admin.updateUserById(found.id, {
      password: newPassword,
    });
    if (updateErr) {
      results.push({ ...acc, error: `updateUserById failed: ${updateErr.message}` });
      continue;
    }

    results.push({ ...acc, password: newPassword });
  }

  console.log('\n=== NOVÁ HESLA — ulož si je hned ===\n');
  console.log(`URL:   ${process.env.APP_URL ?? 'https://arbiq.cz'}/portal/login\n`);
  for (const r of results) {
    console.log(`${r.label}`);
    console.log(`  Email:  ${r.email}`);
    if (r.password) {
      console.log(`  Heslo:  ${r.password}`);
    } else {
      console.log(`  CHYBA:  ${r.error}`);
    }
    console.log();
  }
  console.log('(Po přihlášení si můžete heslo změnit přes /portal/nastaveni.)');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
