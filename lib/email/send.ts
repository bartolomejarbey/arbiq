import 'server-only';

import { Resend } from 'resend';
import { render } from '@react-email/render';
import type { ReactElement } from 'react';

let _resend: Resend | null = null;
function client(): Resend {
  if (!_resend) {
    if (!process.env.RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY is not set');
    }
    _resend = new Resend(process.env.RESEND_API_KEY);
  }
  return _resend;
}

export type EmailPayload = {
  to: string | string[];
  subject: string;
  body: ReactElement;
  bcc?: string[];
  cc?: string[];
  replyTo?: string;
  /** When true, also BCC the admin defined in RESEND_BCC_ADMIN. */
  bccAdmin?: boolean;
};

export async function sendEmail(payload: EmailPayload) {
  if (!process.env.RESEND_FROM) {
    throw new Error('RESEND_FROM is not set');
  }

  const inner = await render(payload.body, { pretty: false });
  const html = wrapInShell(inner);
  const text = htmlToPlainText(html);

  // RESEND_BCC_ADMIN can be a single email or comma-separated list of emails.
  const adminBccList = process.env.RESEND_BCC_ADMIN
    ? process.env.RESEND_BCC_ADMIN.split(',').map((s) => s.trim()).filter(Boolean)
    : [];

  const bcc = [
    ...(payload.bcc ?? []),
    ...(payload.bccAdmin ? adminBccList : []),
  ];

  const result = await client().emails.send({
    from: process.env.RESEND_FROM,
    to: Array.isArray(payload.to) ? payload.to : [payload.to],
    bcc: bcc.length ? bcc : undefined,
    cc: payload.cc,
    replyTo: payload.replyTo,
    subject: payload.subject,
    html,
    text,
  });

  if (result.error) {
    throw new Error(`Resend send failed: ${result.error.message}`);
  }
  return result.data;
}

function wrapInShell(innerHtml: string): string {
  return `<!doctype html>
<html lang="cs">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
</head>
<body style="margin:0;padding:0;background:#18120e;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#18120e;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="background:#241B14;color:#C4B59A;line-height:1.6;">
        <tr><td style="padding:28px 32px 16px 32px;border-bottom:1px solid #3A2D22;">
          <div style="font-family:Georgia,'Times New Roman',serif;font-style:italic;font-weight:900;color:#D8DDE5;font-size:24px;letter-spacing:0.02em;">ARBIQ</div>
          <div style="font-family:'Courier New',monospace;color:#8B7B65;font-size:11px;letter-spacing:0.18em;text-transform:uppercase;margin-top:4px;">Detektivni agentura pro vase podnikani</div>
        </td></tr>
        <tr><td style="padding:28px 32px;color:#C4B59A;font-size:15px;">
          ${innerHtml}
        </td></tr>
        <tr><td style="padding:20px 32px;border-top:1px solid #3A2D22;color:#8B7B65;font-size:12px;line-height:1.5;">
          ARBIQ &middot; Praha &middot; <a href="https://arbiq.cz" style="color:#C9986A;text-decoration:none;">arbiq.cz</a>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function htmlToPlainText(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<head[\s\S]*?<\/head>/gi, '')
    .replace(/<br\s*\/?>(\s*)/gi, '\n')
    .replace(/<\/(p|div|tr|h[1-6]|li)>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&middot;/g, '·')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
