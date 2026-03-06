import { NextResponse } from 'next/server';
import { be } from '@/lib/be';
import { clearAuthCookies, appendSetCookies } from '@/lib/authTokens';
import { ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE } from '@/lib/cookies';

export async function POST() {
  const beRes = await be('/auth/logout', { method: 'POST' });

  let resp: NextResponse;
  if (beRes.status === 204 || beRes.status === 205) {
    resp = new NextResponse(null, { status: beRes.status });
  } else {
    resp = NextResponse.json({ ok: beRes.ok }, { status: beRes.status });
  }

  clearAuthCookies(resp);
  appendSetCookies(resp, beRes, new Set([ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE]));

  resp.headers.set('Cache-Control', 'no-store');

  return resp;
}
