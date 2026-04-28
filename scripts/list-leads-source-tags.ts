/**
 * One-shot diagnostic skript po aplikaci migrace 0003.
 * Vypíše prvních 20 leadů s odhadnutým source_tag, ať můžeš ručně ověřit/opravit.
 *
 * Spuštění: node --env-file=.env.local --experimental-strip-types scripts/list-leads-source-tags.ts
 */
import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const admin = createClient(url, key, { auth: { persistSession: false } });

async function main() {
  const { data, error } = await admin
    .from('landing_leads')
    .select('case_number, name, email, kampan, utm_source, source_tag, created_at')
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) {
    console.error('Query failed:', error);
    process.exit(1);
  }

  if (!data || data.length === 0) {
    console.log('(žádné leady — produkční DB je prázdná)');
    return;
  }

  console.log(`\nPrvních ${data.length} leadů (od nejnovějšího):\n`);
  console.log('case_number'.padEnd(18), 'tag'.padEnd(15), 'kampan'.padEnd(18), 'utm_source'.padEnd(18), 'name');
  console.log('-'.repeat(100));

  for (const r of data) {
    const row = r as {
      case_number: string | null;
      name: string;
      kampan: string;
      utm_source: string | null;
      source_tag: string | null;
    };
    console.log(
      (row.case_number ?? '(none)').padEnd(18),
      (row.source_tag ?? '(null)').padEnd(15),
      (row.kampan ?? '').padEnd(18),
      (row.utm_source ?? '').padEnd(18),
      row.name,
    );
  }

  // Také rozdělení tagů
  const tagCounts: Record<string, number> = {};
  for (const r of data) {
    const t = (r as { source_tag: string | null }).source_tag ?? '(null)';
    tagCounts[t] = (tagCounts[t] ?? 0) + 1;
  }
  console.log('\nRozdělení v top-20:');
  for (const [tag, count] of Object.entries(tagCounts)) {
    console.log(`  ${tag.padEnd(15)} ${count}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
