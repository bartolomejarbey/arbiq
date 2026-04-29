/**
 * One-shot diagnostika: vypíše všechny uživatele v Supabase Auth + jejich profile (role).
 *
 * Spuštění:
 *   node --env-file=.env.local --experimental-strip-types --no-warnings scripts/list-portal-users.ts
 */
import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const admin = createClient(url, serviceKey, { auth: { persistSession: false } });

async function main() {
  const { data: list, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
  if (error) {
    console.error('listUsers failed:', error);
    process.exit(1);
  }

  const { data: profiles } = await admin
    .from('profiles')
    .select('id, email, full_name, role, is_active');

  const profileMap = new Map<string, { full_name: string | null; role: string; is_active: boolean }>();
  for (const p of profiles ?? []) {
    profileMap.set(
      (p as { id: string }).id,
      {
        full_name: (p as { full_name: string | null }).full_name,
        role: (p as { role: string }).role,
        is_active: (p as { is_active: boolean }).is_active,
      }
    );
  }

  console.log(`\n=== ${list.users.length} účtů v Supabase Auth ===\n`);
  for (const u of list.users) {
    const profile = profileMap.get(u.id);
    console.log(`Email:   ${u.email}`);
    console.log(`  ID:    ${u.id}`);
    console.log(`  Role:  ${profile?.role ?? '(žádný profil)'}`);
    console.log(`  Jméno: ${profile?.full_name ?? '(nevyplněno)'}`);
    console.log(`  Aktivní: ${profile?.is_active ?? '(nevyplněno)'}`);
    console.log(`  Vytvořen: ${u.created_at}`);
    console.log(`  Last sign-in: ${u.last_sign_in_at ?? 'nikdy'}`);
    console.log();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
