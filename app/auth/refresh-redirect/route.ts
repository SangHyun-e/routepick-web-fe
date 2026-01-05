import { NextRequest, NextResponse } from 'next/server';
import { be } from '@/lib/be';
import {
  appendSetCookies,
  applyAuthCookies,
  clearAuthCookies,
  parseAccessTokenPayload,
  readRefreshCookie,
} from '@/lib/authTokens';
import { ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE } from '@/lib/cookies';

function safeFrom(raw: string | null): string {
  if (!raw) return '/';
  if (!raw.startsWith('/')) return '/';
  if (raw.startsWith('//')) return '/';
  return raw;
}

export async function GET(req: NextRequest) {
  const from = safeFrom(req.nextUrl.searchParams.get('from'));

  // ✅ 내부 /api/proxy를 fetch로 부르지 말고, be()로 바로 백엔드 refresh 호출
  const refreshRes = await be('/auth/refresh', { method: 'POST' });
  const text = await refreshRes.text();

  if (!refreshRes.ok) {
    // refresh 실패면 쿠키 정리 + 로그인
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('from', from);

    const res = NextResponse.redirect(loginUrl);
    clearAuthCookies(res);
    return res;
  }

  // refresh 성공 → access token + refresh cookie(회전) 반영
  const { access, expiresInSec } = parseAccessTokenPayload(text);
  const refresh = readRefreshCookie(refreshRes);

  const redirectRes = NextResponse.redirect(new URL(from, req.url));

  applyAuthCookies(redirectRes, { access, expiresInSec, refresh: refresh ?? undefined });
  appendSetCookies(redirectRes, refreshRes, new Set([ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE]));

  return redirectRes;
}
