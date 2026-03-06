// app/api/auth/refresh/route.ts
import { NextResponse } from 'next/server';
import { be } from '@/lib/be';
import { cookies } from 'next/headers';
import {
  appendSetCookies,
  applyAuthCookies,
  clearAuthCookies,
  parseAccessTokenPayload,
  readRefreshCookie,
} from '@/lib/authTokens';
import { ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE } from '@/lib/cookies';

export async function POST() {
  const cookieStore = cookies();
  const refreshCookie = cookieStore.get(REFRESH_TOKEN_COOKIE)?.value;
  if (!refreshCookie) {
    return NextResponse.json(
      { message: 'refresh token missing' },
      { status: 401, headers: { 'cache-control': 'no-store' } },
    );
  }

  const beRes = await be('/auth/refresh', { method: 'POST' });
  const text = await beRes.text();

  const res = new NextResponse(text, {
    status: beRes.status,
    headers: { 'content-type': beRes.headers.get('content-type') ?? 'application/json' },
  });

  if (beRes.ok) {
    const { access, expiresInSec } = parseAccessTokenPayload(text);
    const refresh = readRefreshCookie(beRes);
    applyAuthCookies(res, { access, expiresInSec, refresh: refresh ?? undefined });
    appendSetCookies(res, beRes, new Set([ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE]));
  } else {
    clearAuthCookies(res);
  }

  return res;
}
