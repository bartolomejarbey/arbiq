import 'server-only';
import { createAdminClient } from '@/lib/supabase/admin';
import { untyped } from '@/lib/supabase/untyped';

/**
 * Upload PDF/DOCX do private bucketu 'documents' a založení záznamu v public.documents.
 *
 * Storage path konvence:
 *   {clientId}/{type}/{filename}
 *
 * Klient nikdy nečte storage přímo — pro stažení posíláme signed URL přes
 * `getSignedDocumentUrl`.
 */

export type DocumentType = 'faktura' | 'smlouva' | 'nabidka' | 'brief' | 'design' | 'screenshot' | 'report' | 'other';

export type UploadDocumentInput = {
  clientId: string;
  projectId?: string | null;
  type: DocumentType;
  filename: string;
  contentType: string;
  body: Uint8Array | Buffer;
  /** Když je nastaveno, naváže se na vybranou entitu (faktura/smlouva). */
  invoiceId?: string;
  contractId?: string;
  /** Volitelné lidsky čitelné jméno. */
  title?: string | null;
};

export async function uploadDocument(input: UploadDocumentInput) {
  const admin = createAdminClient();
  const slug = input.filename.replace(/[^a-zA-Z0-9._-]+/g, '_');
  const path = `${input.clientId}/${input.type}/${Date.now()}-${slug}`;

  const { error: upErr } = await admin.storage
    .from('documents')
    .upload(path, input.body, {
      contentType: input.contentType,
      upsert: false,
    });
  if (upErr) throw new Error(`Storage upload failed: ${upErr.message}`);

  const row: Record<string, unknown> = {
    client_id: input.clientId,
    project_id: input.projectId ?? null,
    type: input.type,
    // legacy NOT NULL kolony před migrací 0007 — vyplníme oboje pro kompatibilitu
    name: input.filename,
    file_path: path,
    storage_path: path,
    title: input.title ?? input.filename,
    mime_type: input.contentType,
    file_size: input.body.byteLength,
  };
  if (input.invoiceId) row['invoice_id'] = input.invoiceId;
  if (input.contractId) row['contract_id'] = input.contractId;

  const { data, error } = await untyped(admin)
    .from('documents')
    .insert(row)
    .select('id')
    .single();
  if (error) throw new Error(`Document row insert failed: ${error.message}`);

  return { documentId: (data as unknown as { id: string }).id, path };
}

/** Vrátí krátkodobou signed URL (default 1h) pro stažení souboru. */
export async function getSignedDocumentUrl(path: string, expiresInSec = 3600): Promise<string> {
  const admin = createAdminClient();
  const { data, error } = await admin.storage.from('documents').createSignedUrl(path, expiresInSec);
  if (error || !data) throw new Error(`Signed URL failed: ${error?.message ?? 'unknown'}`);
  return data.signedUrl;
}

/** Stáhne PDF/DOCX z bucketu (server-side) — vrátí Buffer. */
export async function downloadDocument(path: string): Promise<Buffer> {
  const admin = createAdminClient();
  const { data, error } = await admin.storage.from('documents').download(path);
  if (error || !data) throw new Error(`Download failed: ${error?.message ?? 'unknown'}`);
  const arr = await data.arrayBuffer();
  return Buffer.from(arr);
}
