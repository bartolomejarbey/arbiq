import 'server-only';

import { createAdminClient } from '@/lib/supabase/admin';
import { untyped } from '@/lib/supabase/untyped';
import { getDodavatel } from '@/lib/config/dodavatel';
import { renderInvoicePdf, type InvoiceDoc, type InvoiceCustomer, type InvoiceItem } from '@/lib/pdf/invoice';
import { buildSpaydPayload } from '@/lib/payments/spayd';
import { uploadDocument } from '@/lib/storage/documents';
import { sendEmail } from '@/lib/email/send';
import { InvoiceDeliveryEmail } from '@/lib/email/templates/invoice-delivery';
import { logClientEmail } from '@/lib/email/correspondence';
import { notifyAdmins } from '@/lib/notifications';
import { formatMoney, formatDate } from '@/lib/formatters';

type RecurringConfig = {
  id: string;
  client_id: string;
  amount: number;
  description: string;
  kind: 'zaloha' | 'konecna' | 'dobropis' | 'paushal';
  due_days: number;
  payment_method: 'bank' | 'card' | 'cash';
  interval_months: number;
  day_of_month: number;
  auto_send: boolean;
  next_run: string;
};

const KIND_LABEL: Record<string, string> = {
  zaloha: 'Zálohová faktura',
  konecna: 'Faktura',
  dobropis: 'Dobropis',
  paushal: 'Paušální faktura',
};

/**
 * Příští spuštění: posune od `from` o interval, dokud není striktně po dnešku
 * (přeskočí zmeškaná období — žádné zpětné dofakturování).
 */
function computeNextRun(from: string, intervalMonths: number, day: number, today: string): string {
  let d = new Date(`${from}T00:00:00`);
  const safeDay = Math.min(day, 28);
  do {
    d = new Date(d.getFullYear(), d.getMonth() + intervalMonths, safeDay);
  } while (d.toISOString().slice(0, 10) <= today);
  return d.toISOString().slice(0, 10);
}

function addDays(base: string, days: number): string {
  const d = new Date(`${base}T00:00:00`);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

/**
 * Vygeneruje (a volitelně odešle) splatné pravidelné faktury. Idempotentní:
 * po vygenerování posune next_run do budoucna. Spouští denní cron.
 */
export async function runRecurringInvoices(): Promise<{ generated: number; sent: number; errors: number }> {
  const admin = createAdminClient();
  const today = new Date().toISOString().slice(0, 10);

  const { data: cfgRows } = await untyped(admin)
    .from('recurring_invoices')
    .select('id, client_id, amount, description, kind, due_days, payment_method, interval_months, day_of_month, auto_send, next_run')
    .eq('active', true)
    .lte('next_run', today);
  const configs = (cfgRows ?? []) as unknown as RecurringConfig[];
  if (configs.length === 0) return { generated: 0, sent: 0, errors: 0 };

  const dodavatel = await getDodavatel();
  let generated = 0;
  let sent = 0;
  let errors = 0;

  for (const cfg of configs) {
    try {
      const { data: prof } = await untyped(admin)
        .from('profiles')
        .select('full_name, email, phone, company, ico, dic, street, city, billing_email')
        .eq('id', cfg.client_id)
        .single();
      const p = prof as Record<string, string | null> | null;

      const { data: numData } = await untyped(admin).rpc('next_invoice_number');
      const invoiceNumber = typeof numData === 'string' ? numData : `F${Date.now()}`;
      const variableSymbol = invoiceNumber.replace(/\D/g, '');
      const amount = Number(cfg.amount);
      const dueDate = addDays(today, cfg.due_days);
      const items: InvoiceItem[] = [{ label: cfg.description, description: null, quantity: 1, unit: 'ks', unit_price: amount }];

      const { data: ins, error: insErr } = await untyped(admin)
        .from('invoices')
        .insert({
          client_id: cfg.client_id,
          invoice_number: invoiceNumber,
          kind: cfg.kind,
          amount,
          description: cfg.description,
          issued_at: today,
          due_date: dueDate,
          status: 'ceka',
          variable_symbol: variableSymbol,
          payment_method: cfg.payment_method,
          currency: 'CZK',
          items: items as unknown as object,
        })
        .select('id')
        .single();
      if (insErr || !ins) throw new Error(insErr?.message ?? 'invoice insert failed');
      const invoiceId = (ins as { id: string }).id;

      const customer: InvoiceCustomer = {
        full_name: p?.full_name ?? 'Klient',
        email: p?.email ?? null,
        phone: p?.phone ?? null,
        company: p?.company ?? null,
        ico: p?.ico ?? null,
        dic: p?.dic ?? null,
        street: p?.street ?? null,
        city: p?.city ?? null,
      };
      const doc: InvoiceDoc = {
        invoiceNumber,
        kind: cfg.kind,
        issuedAt: today,
        taxableAt: today,
        dueDate,
        variableSymbol,
        constantSymbol: null,
        paymentMethod: cfg.payment_method,
        currency: 'CZK',
        items,
        description: cfg.description,
      };
      const pdf = await renderInvoicePdf({ invoice: doc, customer, dodavatel });
      const qrPayload = cfg.payment_method === 'cash' ? null : buildSpaydPayload({
        iban: dodavatel.iban,
        bic: dodavatel.bic,
        amount,
        currency: 'CZK',
        variableSymbol,
        message: `Faktura ${invoiceNumber}`,
      });
      const safeNum = invoiceNumber.replace(/[^A-Za-z0-9-]/g, '_');
      const filename = cfg.kind === 'zaloha' ? `Zalohova-faktura-${safeNum}.pdf` : `Faktura-${safeNum}.pdf`;
      const up = await uploadDocument({
        clientId: cfg.client_id,
        type: 'faktura',
        filename,
        contentType: 'application/pdf',
        body: pdf,
        invoiceId,
        title: filename,
      });
      await untyped(admin).from('invoices').update({ pdf_url: up.path, qr_payload: qrPayload }).eq('id', invoiceId);
      generated++;

      const recipient = p?.billing_email || p?.email || null;
      const kindLabel = KIND_LABEL[cfg.kind] ?? 'Faktura';
      if (cfg.auto_send && recipient && process.env.RESEND_API_KEY) {
        await sendEmail({
          to: recipient,
          subject: `${kindLabel} ${invoiceNumber} (${formatMoney(amount)})`,
          replyTo: process.env.RESEND_REPLY_TO,
          body: InvoiceDeliveryEmail({
            name: p?.full_name?.split(' ')[0] || 'kliente',
            invoiceNumber,
            amount: formatMoney(amount),
            dueDate: formatDate(dueDate),
            kindLabel,
          }),
          attachments: [{ filename, content: pdf }],
        });
        await untyped(admin).from('invoices').update({ shared_at: new Date().toISOString() }).eq('id', invoiceId);
        await logClientEmail({
          clientId: cfg.client_id,
          direction: 'outbound',
          fromEmail: process.env.RESEND_FROM ?? 'noreply@arbiq.cz',
          toEmail: recipient,
          subject: `${kindLabel} ${invoiceNumber}`,
          body: `Pravidelná faktura ${invoiceNumber} na ${formatMoney(amount)} odeslána jako PDF příloha. Splatnost ${formatDate(dueDate)}.`,
        });
        sent++;
      } else {
        await notifyAdmins({
          type: 'recurring_invoice',
          title: `Vygenerována pravidelná faktura ${invoiceNumber}`,
          body: `${p?.full_name ?? ''} · ${formatMoney(amount)} — k odeslání`,
          link: '/portal/admin/faktury',
        });
      }

      await untyped(admin)
        .from('recurring_invoices')
        .update({
          last_run: today,
          next_run: computeNextRun(cfg.next_run, cfg.interval_months, cfg.day_of_month, today),
          last_invoice_id: invoiceId,
        })
        .eq('id', cfg.id);
    } catch (err) {
      errors++;
      console.error('[RECURRING] failed for config', cfg.id, err);
    }
  }

  return { generated, sent, errors };
}
