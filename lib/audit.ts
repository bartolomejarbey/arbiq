import 'server-only';

import { createAdminClient } from '@/lib/supabase/admin';
import { untyped } from '@/lib/supabase/untyped';

/**
 * Zapíše citlivou admin akci do admin_audit_log (append-only, čte jen admin).
 * Best-effort — nikdy nehází, aby nezablokovala samotnou akci.
 */
export async function logAdminAction(opts: {
  actorId: string;
  action: string;
  targetId?: string | null;
  targetType?: string | null;
  detail?: Record<string, unknown> | null;
}): Promise<void> {
  try {
    const admin = createAdminClient();
    await untyped(admin).from('admin_audit_log').insert({
      actor_id: opts.actorId,
      action: opts.action,
      target_id: opts.targetId ?? null,
      target_type: opts.targetType ?? null,
      detail: opts.detail ?? null,
    });
  } catch (err) {
    console.error('[AUDIT] log failed', err);
  }
}
