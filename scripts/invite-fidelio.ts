/**
 * One-shot skript: založí účet pro Fidelio Seidl (Key Account Manager → role 'obchodnik').
 * Údaje převzaty z app/tym/page.tsx — neptej se uživatele.
 *
 * Spuštění:
 *   node --env-file=.env.local --experimental-strip-types --no-warnings scripts/invite-fidelio.ts
 *
 * Idempotentní: pokud uživatel s daným emailem už existuje, jen se aktualizuje profile a vytiskne info.
 */
import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const admin = createClient(url, serviceKey, { auth: { persistSession: false } });

const FIDELIO = {
  email: 'fidelio@arbiq.cz',
  full_name: 'Fidelio Seidl',
  phone: '+420 739 609 841',
  role: 'obchodnik' as const,
};

function generatePassword(length = 14): string {
  const chars = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789!@#$%';
  let out = '';
  for (let i = 0; i < length; i += 1) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return out;
}

async function main() {
  // 1) Existuje už ten user?
  const { data: existingList } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
  const existing = existingList.users.find((u) => u.email?.toLowerCase() === FIDELIO.email.toLowerCase());

  let userId: string;
  let password: string | null = null;

  if (existing) {
    userId = existing.id;
    console.log(`✓ Auth user už existuje: ${FIDELIO.email} (id ${userId})`);
  } else {
    password = generatePassword();
    const { data: created, error } = await admin.auth.admin.createUser({
      email: FIDELIO.email,
      password,
      email_confirm: true,
      user_metadata: { full_name: FIDELIO.full_name, role: FIDELIO.role },
    });
    if (error || !created?.user) {
      console.error('createUser failed:', error);
      process.exit(1);
    }
    userId = created.user.id;
    console.log(`✓ Auth user vytvořen: ${FIDELIO.email} (id ${userId})`);
  }

  // 2) Update profile (trigger on_auth_user_created už insertl základ)
  const { error: profileErr } = await admin
    .from('profiles')
    .update({
      full_name: FIDELIO.full_name,
      phone: FIDELIO.phone,
      role: FIDELIO.role,
      is_active: true,
    })
    .eq('id', userId);
  if (profileErr) {
    console.error('profile update failed:', profileErr);
    process.exit(1);
  }
  console.log(`✓ Profile updated (role=${FIDELIO.role}, full_name=${FIDELIO.full_name}, phone=${FIDELIO.phone})`);

  // 3) Vytisknout přihlašovací údaje (pokud nově vytvořeno)
  if (password) {
    console.log(`\n=== INVITE INFO (předej Fideliovi) ===`);
    console.log(`URL:      ${process.env.APP_URL ?? 'https://arbiq.cz'}/portal/login`);
    console.log(`Email:    ${FIDELIO.email}`);
    console.log(`Heslo:    ${password}`);
    console.log(`(po přihlášení si může heslo změnit přes Nastavení)`);
  } else {
    console.log(`\n(Účet už existoval — heslo známe jen my, ne tento skript.)`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
