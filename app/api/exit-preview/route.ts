import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/** Tvrdý únik z náhledového režimu — smaže arbiq_preview cookie a pošle na login. */
export async function GET(request: Request) {
  const res = NextResponse.redirect(new URL('/portal/login', request.url));
  res.cookies.delete('arbiq_preview');
  return res;
}
