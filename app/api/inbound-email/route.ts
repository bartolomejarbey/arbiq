import 'server-only';

import { NextResponse, type NextRequest } from 'next/server';
import { Resend } from 'resend';
import { findClientByEmail, logClientEmail } from '@/lib/email/correspondence';

// Inbound zpracování zahrnuje fetch těla, stažení příloh a forward — dáme jí dost času.
export const maxDuration = 60;
// Webhook nese podpis přes raw body — vyloučíme jakékoliv pre-parsing.
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const LOG = '[INBOUND EMAIL]';

let _resend: Resend | null = null;
function getResend(): Resend {
  if (!_resend) {
    if (!process.env.RESEND_API_KEY) throw new Error('RESEND_API_KEY is not set');
    _resend = new Resend(process.env.RESEND_API_KEY);
  }
  return _resend;
}

type ForwardAttachment = {
  content: Buffer;
  filename?: string;
  contentType?: string;
  contentId?: string;
};

export async function POST(req: NextRequest) {
  try {
    const secret = process.env.RESEND_INBOUND_WEBHOOK_SECRET;
    const destination = process.env.RESEND_FORWARD_DESTINATION;

    if (!secret) {
      console.error(`${LOG} RESEND_INBOUND_WEBHOOK_SECRET není nastavený`);
      return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 });
    }
    if (!destination) {
      console.error(`${LOG} RESEND_FORWARD_DESTINATION není nastavený`);
      return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 });
    }

    // 1) Raw body + svix headers
    const rawBody = await req.text();
    const svixId = req.headers.get('svix-id');
    const svixTimestamp = req.headers.get('svix-timestamp');
    const svixSignature = req.headers.get('svix-signature');

    if (!svixId || !svixTimestamp || !svixSignature) {
      console.error(`${LOG} Chybí svix headers`, {
        hasId: !!svixId,
        hasTs: !!svixTimestamp,
        hasSig: !!svixSignature,
      });
      return NextResponse.json({ error: 'Missing signature headers' }, { status: 401 });
    }

    const resend = getResend();

    // 2) Ověř podpis. Resend SDK delegates na svix — verify hází na neplatný podpis.
    let event;
    try {
      event = resend.webhooks.verify({
        payload: rawBody,
        headers: {
          id: svixId,
          timestamp: svixTimestamp,
          signature: svixSignature,
        },
        webhookSecret: secret,
      });
    } catch (err) {
      console.error(`${LOG} Verifikace podpisu selhala:`, err);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    // 3) Filtrujeme jen email.received. Ostatní vrátíme 200 (no-op) — žádný retry.
    if (event.type !== 'email.received') {
      console.log(`${LOG} Ignoruji event typu`, event.type);
      return NextResponse.json({ success: true, ignored: event.type });
    }

    const emailId = event.data.email_id;

    // 4) Stáhni plné tělo emailu (webhook payload obsahuje jen metadata).
    const emailRes = await resend.emails.receiving.get(emailId);
    if (emailRes.error || !emailRes.data) {
      console.error(`${LOG} Nepodařilo se načíst tělo emailu`, {
        emailId,
        error: emailRes.error,
      });
      return NextResponse.json({ error: 'Failed to fetch email body' }, { status: 500 });
    }
    const email = emailRes.data;

    // 4b) Napáruj odesílatele na klienta → zaloguj do jeho korespondence v zóně.
    //     Best-effort, nesmí shodit forward.
    try {
      const senderRaw = email.from ?? event.data.from ?? '';
      const clientId = await findClientByEmail(senderRaw);
      if (clientId) {
        const plainBody = email.text?.trim() || stripHtml(email.html ?? '');
        await logClientEmail({
          clientId,
          direction: 'inbound',
          fromEmail: senderRaw,
          toEmail: (email.to && email.to[0]) ?? event.data.to?.[0] ?? null,
          subject: email.subject ?? null,
          body: plainBody || null,
          messageId: email.message_id ?? null,
        });
      }
    } catch (err) {
      console.error(`${LOG} Logování korespondence selhalo`, err);
    }

    // 5) Příloh — pokud existují, stáhni je přes signed download_url.
    const forwardAttachments: ForwardAttachment[] = [];
    if (event.data.attachments && event.data.attachments.length > 0) {
      const attRes = await resend.emails.receiving.attachments.list({ emailId });
      if (attRes.error) {
        console.error(`${LOG} Nepodařilo se vylistovat přílohy`, attRes.error);
      } else if (attRes.data) {
        for (const att of attRes.data.data) {
          try {
            const dl = await fetch(att.download_url);
            if (!dl.ok) {
              console.error(`${LOG} Stažení přílohy selhalo`, {
                filename: att.filename,
                status: dl.status,
              });
              continue;
            }
            const buf = Buffer.from(await dl.arrayBuffer());
            forwardAttachments.push({
              content: buf,
              filename: att.filename ?? undefined,
              contentType: att.content_type,
              contentId:
                att.content_disposition === 'inline' && att.content_id
                  ? att.content_id
                  : undefined,
            });
          } catch (err) {
            console.error(`${LOG} Chyba při stahování přílohy`, {
              filename: att.filename,
              err,
            });
          }
        }
      }
    }

    // 6) Forward přes resend.emails.send.
    const originalFrom = email.from ?? event.data.from ?? '';
    const originalTo = (email.to && email.to[0]) ?? event.data.to?.[0] ?? 'arbiq.cz';
    const originalSubject = email.subject?.trim() || '(bez předmětu)';
    const originalHtml =
      email.html ??
      (email.text
        ? `<pre style="white-space:pre-wrap;font-family:inherit;margin:0">${escapeHtml(email.text)}</pre>`
        : '<p><em>(prázdné tělo emailu)</em></p>');

    const footerHtml = `
<hr style="margin:24px 0;border:none;border-top:1px solid #d4d4d4">
<div style="font-family:Menlo,Consolas,'Courier New',monospace;font-size:12px;color:#666;line-height:1.6">
  <strong>──────────────────────────────</strong><br>
  Forwardováno z <strong>${escapeHtml(originalTo)}</strong><br>
  Původní odesílatel: <strong>${escapeHtml(originalFrom)}</strong><br>
  Předmět: ${escapeHtml(originalSubject)}<br>
  Message-ID: <code>${escapeHtml(email.message_id ?? '—')}</code>
</div>`;

    const forwardSubject = `[FWD z ${originalTo}] ${originalSubject}`;

    const forwardRes = await resend.emails.send({
      from: 'ARBIQ Inbound <noreply@arbiq.cz>',
      to: destination,
      subject: forwardSubject,
      replyTo: originalFrom || undefined,
      html: originalHtml + footerHtml,
      attachments: forwardAttachments.length > 0 ? forwardAttachments : undefined,
    });

    if (forwardRes.error) {
      console.error(`${LOG} Forward send selhal`, {
        emailId,
        error: forwardRes.error,
      });
      return NextResponse.json({ error: 'Forward send failed' }, { status: 500 });
    }

    console.log(`${LOG} Forwardnuto`, {
      emailId,
      forwardId: forwardRes.data?.id,
      to: destination,
      attachments: forwardAttachments.length,
    });

    return NextResponse.json({
      success: true,
      forwardedTo: destination,
      forwardId: forwardRes.data?.id ?? null,
    });
  } catch (err) {
    console.error(`${LOG} Unhandled error:`, err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

function stripHtml(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<br\s*\/?>(\s*)/gi, '\n')
    .replace(/<\/(p|div|tr|li|h[1-6])>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
