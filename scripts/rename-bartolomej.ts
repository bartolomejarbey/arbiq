/**
 * One-shot skript: změna full_name + hesla pro bartolomej@arbey.cz.
 *
 * Spuštění:
 *   node --env-file=.env.local --experimental-strip-types --no-warnings scripts/rename-bartolomej.ts
 *
 * Použivá Supabase service-role key — obejde RLS, atomicky updatne auth.users (heslo)
 * i public.profiles (full_name). Email se nemění.
 */
import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const admin = createClient(url, serviceKey, { auth: { persistSession: false } });

const EMAIL = 'bartolomej@arbey.cz';
const NEW_FULL_NAME = 'Bartolomej21';
const NEW_PASSWORD = 'AarbeyFur25.';

async function main() {
  const { data: list, error: listErr } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
  if (listErr) {
    console.error('listUsers failed:', listErr);
    process.exit(1);
  }

  const user = list.users.find((u) => u.email?.toLowerCase() === EMAIL.toLowerCase());
  if (!user) {
    console.error(`Účet ${EMAIL} v Supabase Auth neexistuje.`);
    process.exit(1);
  }

  const { error: pwErr } = await admin.auth.admin.updateUserById(user.id, {
    password: NEW_PASSWORD,
  });
  if (pwErr) {
    console.error('Heslo se nepodařilo změnit:', pwErr.message);
    process.exit(1);
  }

  const { error: profileErr } = await admin
    .from('profiles')
    .update({ full_name: NEW_FULL_NAME })
    .eq('id', user.id);
  if (profileErr) {
    console.error('profiles.full_name se nepodařilo změnit:', profileErr.message);
    process.exit(1);
  }

  console.log('\n=== Hotovo ===\n');
  console.log(`Email:      ${EMAIL}  (beze změny)`);
  console.log(`Full name:  ${NEW_FULL_NAME}`);
  console.log(`Heslo:      ${NEW_PASSWORD}`);
  console.log(`URL:        ${process.env.APP_URL ?? 'https://arbiq.cz'}/portal/login\n`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
