// app/api/me/route.ts
import { NextResponse } from 'next/server';
import { ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE, expiredCookieOptions } from '@/lib/cookies';
import { be, splitSetCookies } from '@/lib/be';

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

export async function GET() {
  // 1차 시도
  let beRes = await be('/users/me', { method: 'GET' });

  // 401이면 refresh 1회
  if (beRes.status === 401) {
    const refreshRes = await be('/auth/refresh', { method: 'POST' });
    const refreshText = await refreshRes.text();

    if (refreshRes.ok) {
      // 백엔드 JSON에서 access/만료 추출
      let access: string | null = null;
      let expiresInSec: number | undefined;
      try {
        const json = JSON.parse(refreshText);
        access = json?.access ?? json?.accessToken ?? json?.token ?? null;
        expiresInSec = json?.expiresInSec ?? json?.expiresIn;
      } catch {
        /* ignore */
      }

      // 최종 응답 객체(본문은 나중에 교체)
      // 여기서 바로 쿠키 세팅
      const cookiesToSet: Array<{ name: string; value: string; maxAge?: number }> = [];

      if (access) {
        cookiesToSet.push({
          name: ACCESS_TOKEN_COOKIE, // 'rp_at'
          value: access,
          maxAge: Number.isFinite(expiresInSec as number) ? (expiresInSec as number) : undefined,
        });
      }

      // 백엔드의 Set-Cookie에서 RP_REFRESH 추출
      const setCookies = splitSetCookies(refreshRes);
      for (const cookie of setCookies) {
        const parsed = parseCookie(cookie, REFRESH_TOKEN_COOKIE);
        if (!parsed) continue;
        cookiesToSet.push({
          name: REFRESH_TOKEN_COOKIE,
          value: parsed.value,
          maxAge: parsed.maxAge,
        });
      }

      // 새 AT/RT 심은 뒤 실제 데이터 재조회
      beRes = await be('/users/me', {
        method: 'GET',
        headers: access ? { Authorization: `Bearer ${access}` } : undefined, // ← 추가
      });

      const body = await beRes.text();
      const final = new NextResponse(body, {
        status: beRes.status,
        headers: { 'content-type': beRes.headers.get('content-type') ?? 'application/json' },
      });

      // 쿠키를 "최종 응답"에 직접 세팅
      for (const ck of cookiesToSet) {
        final.cookies.set(ck.name, ck.value, {
          httpOnly: true,
          sameSite: 'lax',
          secure: process.env.NODE_ENV === 'production',
          path: '/',
          ...(ck.maxAge !== undefined ? { maxAge: ck.maxAge } : {}),
        });
      }

      return final;
    } else {
      // refresh 실패면 AT/RT 같이 제거 권장
      const final = new NextResponse(refreshText, { status: 401 });
      final.cookies.set(ACCESS_TOKEN_COOKIE, '', expiredCookieOptions);
      final.cookies.set(REFRESH_TOKEN_COOKIE, '', expiredCookieOptions);
      return final;
    }
  }

  // 정상 케이스
  const body = await beRes.text();
  return new NextResponse(body, {
    status: beRes.status,
    headers: { 'content-type': beRes.headers.get('content-type') ?? 'application/json' },
  });
}
