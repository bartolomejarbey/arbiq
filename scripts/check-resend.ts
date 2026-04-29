/**
 * Diagnostika Resend: ověří API key, status domén, pošle testovací email.
 *
 * Spuštění (test email půjde na default bartolomejrota@gmail.com):
 *   node --env-file=.env.local --experimental-strip-types --no-warnings scripts/check-resend.ts
 *
 * Nebo s vlastní cílovou adresou:
 *   node --env-file=.env.local --experimental-strip-types --no-warnings scripts/check-resend.ts bartolomej@arbey.cz
 */

const RESEND_API = 'https://api.resend.com';
const apiKey = process.env.RESEND_API_KEY;
const fromHeader = process.env.RESEND_FROM ?? 'ARBIQ <noreply@arbiq.cz>';
const replyTo = process.env.RESEND_REPLY_TO ?? null;
const bccAdmin = process.env.RESEND_BCC_ADMIN ?? null;
const targetEmail = process.argv[2] ?? 'bartolomej@arbey.cz';

function ok(msg: string) {
  console.log(`  ✓ ${msg}`);
}

function fail(msg: string): never {
  console.log(`  ✗ ${msg}`);
  process.exit(1);
}

async function main() {
  console.log('\n=== RESEND DIAGNOSTIKA ===\n');

  // === Krok 1: Env vars ===
  console.log('Krok 1: Env vars z .env.local');
  if (!apiKey) fail('RESEND_API_KEY není nastavený. Zkontroluj .env.local.');
  ok(`RESEND_API_KEY = ${apiKey.slice(0, 7)}...${apiKey.slice(-4)} (${apiKey.length} znaků)`);
  ok(`RESEND_FROM = ${fromHeader}`);
  ok(`RESEND_REPLY_TO = ${replyTo ?? '(nenastaveno)'}`);
  ok(`RESEND_BCC_ADMIN = ${bccAdmin ?? '(nenastaveno)'}`);
  console.log();

  // === Krok 2: API key valid + list domains ===
  console.log('Krok 2: Volání GET /domains (ověřuje API key + vypisuje stav)');
  const domRes = await fetch(`${RESEND_API}/domains`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  if (domRes.status === 401) fail(`API key je neplatný (HTTP 401). Vygeneruj nový na resend.com/api-keys.`);
  if (domRes.status === 403) fail(`API key nemá Sending access (HTTP 403). Vytvoř nový s typem Sending.`);
  if (!domRes.ok) {
    const txt = await domRes.text();
    fail(`HTTP ${domRes.status}: ${txt}`);
  }
  ok(`API key je platný (HTTP ${domRes.status}).`);

  const domData = (await domRes.json()) as { data?: Array<{ id: string; name: string; status: string; region: string }> };
  const domains = domData.data ?? [];
  if (domains.length === 0) fail('V tomto Resend účtu není žádná doména. Přidej arbiq.cz na resend.com/domains.');

  for (const d of domains) {
    const status = d.status === 'verified' ? '✓ verified' : `✗ ${d.status}`;
    console.log(`  - ${d.name} (${d.region}): ${status}`);
  }

  const arbiq = domains.find((d) => d.name === 'arbiq.cz');
  if (!arbiq) fail('Doména arbiq.cz není v tomto Resend účtu. Přidej ji a verifikuj DNS.');
  if (arbiq.status !== 'verified') {
    fail(`arbiq.cz není verified (status=${arbiq.status}). Zkontroluj DNS records (SPF + DKIM) u registrátora.`);
  }
  ok('arbiq.cz je verified — můžeš odesílat z noreply@arbiq.cz.');
  console.log();

  // === Krok 3: Send test email ===
  console.log(`Krok 3: Odeslání testovacího emailu na ${targetEmail}`);
  const sendRes = await fetch(`${RESEND_API}/emails`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: fromHeader,
      to: targetEmail,
      ...(replyTo
        ? { reply_to: replyTo.includes(',') ? replyTo.split(',').map((s) => s.trim()).filter(Boolean) : replyTo }
        : {}),
      ...(bccAdmin ? { bcc: bccAdmin.split(',').map((s) => s.trim()) } : {}),
      subject: `ARBIQ Resend smoke test — ${new Date().toISOString().slice(0, 16)}`,
      html: `
        <h2>Resend smoke test</h2>
        <p>Toto je diagnostický email z <code>scripts/check-resend.ts</code>.</p>
        <p>Pokud ho čteš, znamená to že:</p>
        <ul>
          <li>API key je platný a má Sending access</li>
          <li>Doména arbiq.cz je verified</li>
          <li>Odesílání z <strong>${fromHeader}</strong> funguje</li>
        </ul>
        <p>Reply-To: <code>${replyTo ?? '(nenastaveno)'}</code></p>
        <p>BCC admin: <code>${bccAdmin ?? '(nenastaveno)'}</code></p>
        <p>Čas: ${new Date().toString()}</p>
      `,
    }),
  });

  if (!sendRes.ok) {
    const txt = await sendRes.text();
    fail(`Odeslání selhalo (HTTP ${sendRes.status}): ${txt}`);
  }
  const sendData = (await sendRes.json()) as { id?: string };
  ok(`Email přijat Resendem, ID: ${sendData.id}`);
  console.log();

  // === Krok 4: Co dál ===
  console.log('Krok 4: Co teď zkontrolovat ručně');
  console.log(`  1. Otevři ${targetEmail} — email by měl přijít do 30 sec.`);
  console.log(`  2. Zkontroluj Resend Dashboard → Logs (resend.com/emails) — najdi ID ${sendData.id}, status musí být Delivered.`);
  if (bccAdmin) {
    console.log(`  3. Zkontroluj BCC příjemce (${bccAdmin}) — pokud forwardují na arbey.cz, ověř příchod tam.`);
  }
  if (replyTo) {
    console.log(`  4. V doručeném emailu klikni Reply — pole "To:" musí být ${replyTo}.`);
  }
  console.log();
  console.log('=== HOTOVO ===\n');
}

main().catch((e) => {
  console.error('\nNečekaná chyba:', e);
  process.exit(1);
});
