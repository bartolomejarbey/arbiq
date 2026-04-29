/**
 * Idempotentní setup portál účtů: vytvoří nebo resetuje hesla pro Bartoloměje + Fidelia.
 *
 * Spuštění:
 *   node --env-file=.env.local --experimental-strip-types --no-warnings scripts/create-portal-users.ts
 *
 * Co se stane:
 * - Pokud uživatel s daným emailem ještě neexistuje v Supabase Auth → vytvoří se (email_confirm=true).
 * - Pokud existuje → nastaví se nové heslo.
 * - V obou případech se aktualizuje row v public.profiles (full_name, phone, role, is_active).
 * - Vypíše do stdoutu nová hesla — ulož si je hned, podruhé se neukážou.
 *
 * Stará verze účtů na arbiq.cz (fidelio@arbiq.cz z předchozího invite) zůstane.
 * Dashboard → Authentication → Users — můžeš ji smazat ručně.
 */
import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const admin = createClient(url, serviceKey, { auth: { persistSession: false } });

const ACCOUNTS = [
  {
    email: 'bartolomej@arbey.cz',
    full_name: 'Bartoloměj Rota',
    phone: '+420 725 932 729',
    role: 'admin' as const,
  },
  {
    email: 'fidelio@arbey.cz',
    full_name: 'Fidelio Seidl',
    phone: '+420 739 609 841',
    role: 'obchodnik' as const,
  },
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

  console.log('\n=== PORTAL USERS — vytváření / reset hesel ===\n');
  console.log(`URL:   ${process.env.APP_URL ?? 'https://arbiq.cz'}/portal/login\n`);

  for (const acc of ACCOUNTS) {
    const existing = list.users.find((u) => u.email?.toLowerCase() === acc.email.toLowerCase());
    const password = generatePassword();
    let userId: string;
    let action: 'created' | 'updated';

    if (existing) {
      userId = existing.id;
      const { error: updErr } = await admin.auth.admin.updateUserById(userId, { password });
      if (updErr) {
        console.log(`✗ ${acc.email}: ${updErr.message}`);
        continue;
      }
      action = 'updated';
    } else {
      const { data: created, error: crErr } = await admin.auth.admin.createUser({
        email: acc.email,
        password,
        email_confirm: true,
        user_metadata: { full_name: acc.full_name, role: acc.role },
      });
      if (crErr || !created?.user) {
        console.log(`✗ ${acc.email}: ${crErr?.message ?? 'createUser returned no user'}`);
        continue;
      }
      userId = created.user.id;
      action = 'created';
    }

    // Profil row už trigger on_auth_user_created založil — jen update doplníme.
    const { error: profErr } = await admin
      .from('profiles')
      .update({
        full_name: acc.full_name,
        phone: acc.phone,
        role: acc.role,
        is_active: true,
      })
      .eq('id', userId);
    if (profErr) {
      console.log(`  ⚠ profile update failed: ${profErr.message}`);
    }

    console.log(`✓ ${acc.full_name} (${action})`);
    console.log(`  Email:  ${acc.email}`);
    console.log(`  Heslo:  ${password}`);
    console.log(`  Role:   ${acc.role}`);
    console.log();
  }

  // Nastav default_lead_assignee na admina, pokud existuje
  const adminAcc = ACCOUNTS.find((a) => a.role === 'admin');
  if (adminAcc) {
    const adminUser = list.users.find((u) => u.email?.toLowerCase() === adminAcc.email.toLowerCase());
    if (adminUser) {
      await admin
        .from('app_settings')
        .update({ value: adminUser.id })
        .eq('key', 'default_lead_assignee');
      console.log(`✓ default_lead_assignee nastaven na ${adminAcc.email}`);
    }
  }

  // Upozorni na staré arbiq účty
  const stale = list.users.filter((u) =>
    ['bartolomej@arbiq.cz', 'fidelio@arbiq.cz'].includes(u.email?.toLowerCase() ?? '')
  );
  if (stale.length > 0) {
    console.log('\n⚠ Staré arbiq.cz účty stále existují v Supabase Auth:');
    for (const u of stale) {
      console.log(`  - ${u.email} (id ${u.id})`);
    }
    console.log('  Smaž je v Supabase Dashboard → Authentication → Users, ať nematou.');
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
