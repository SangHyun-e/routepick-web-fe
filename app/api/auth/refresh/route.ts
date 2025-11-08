// app/api/auth/refresh/route.ts
import { NextResponse } from 'next/server';
import { be, splitSetCookies } from '@/lib/be';
import { ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE, expiredCookieOptions } from '@/lib/cookies';
import { cookies } from 'next/headers';

// 개별 Set-Cookie 문자열에서 특정 쿠키의 value / max-age를 추출
function parseCookie(setCookie: string, target: string) {
  const [nameValue, ...attributes] = setCookie.split(';');
  if (!nameValue) return null;

  const [name, ...valueParts] = nameValue.split('=');
  if (!name) return null;
  if (name.trim().toLowerCase() !== target.toLowerCase()) return null;

  const value = valueParts.join('=');
  let maxAge: number | undefined;

  for (const attr of attributes) {
    const [rawKey, rawVal] = attr.split('=');
    if (!rawKey) continue;
    if (rawKey.trim().toLowerCase() !== 'max-age') continue;

    const parsed = Number.parseInt((rawVal ?? '').trim(), 10);
    if (Number.isFinite(parsed)) {
      maxAge = parsed;
    }
  }

  return { value, maxAge };
}

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

  // 1) 백엔드 body에서 access 추출 → rp_at 심기
  if (beRes.ok) {
    try {
      const json = JSON.parse(text);
      const access = json?.access ?? json?.accessToken ?? json?.token ?? null;
      const expiresInSec = json?.expiresInSec ?? json?.expiresIn ?? 3600;
      if (access) {
        res.cookies.set(ACCESS_TOKEN_COOKIE, access, {
          httpOnly: true,
          sameSite: 'lax',
          secure: process.env.NODE_ENV === 'production',
          path: '/',
          maxAge: Number.isFinite(expiresInSec) ? expiresInSec : 3600,
        });
      }
    } catch {
      /* ignore */
    }
  } else {
    // 실패 시 access 제거
    res.cookies.set(ACCESS_TOKEN_COOKIE, '', expiredCookieOptions);
  }

  // 2) 백엔드의 Set-Cookie들(회전된 RP_REFRESH 포함)을 배열로 받고, 거기서 RP_REFRESH만 뽑아 재설정
  const setCookies = splitSetCookies(beRes); // ← 정규식 split 대체
  for (const c of setCookies) {
    const parsed = parseCookie(c, REFRESH_TOKEN_COOKIE); // 'RP_REFRESH'
    if (!parsed) continue;

    res.cookies.set(REFRESH_TOKEN_COOKIE, parsed.value, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      ...(parsed.maxAge !== undefined ? { maxAge: parsed.maxAge } : {}),
    });
  }

  return res;
}
