import 'server-only';

import { NextResponse } from 'next/server';
import { requireViewer } from '@/lib/supabase/viewer';
import { buildAuthUrl } from '@/lib/google/oauth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const viewer = await requireViewer();
  if (viewer.isPreview) {
    return NextResponse.redirect(
      `${process.env.APP_URL}/portal/nastaveni/kalendar?err=preview`,
    );
  }
  return NextResponse.redirect(buildAuthUrl(viewer.id));
}
