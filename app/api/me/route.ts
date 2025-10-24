// app/api/me/route.ts
import { NextResponse } from 'next/server';
import { backendFetch } from '@/lib/backendFetch';
import { ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE, expiredCookieOptions } from '@/lib/cookies';

function splitSetCookies(setCookieHeader: string | null): string[] {
  if (!setCookieHeader) return [];
  // Node fetch는 여러 개의 Set-Cookie를 콤마로 이어줄 수 있으므로 안전한 스플릿
  return setCookieHeader.split(/,(?=\s*[A-Za-z0-9_-]+=)/);
}

function pickCookieValue(src: string, name: string) {
  const m = src.match(new RegExp(`${name}=([^;]+)`));
  return m?.[1] ?? null;
}
function pickMaxAge(src: string) {
  const m = src.match(/max-age=(\d+)/i);
  return m ? parseInt(m[1], 10) : undefined;
}

export async function GET() {
  // 1차 시도
  let beRes = await backendFetch('/users/me', { method: 'GET' });

  // 401이면 refresh 1회
  if (beRes.status === 401) {
    const refreshRes = await backendFetch('/auth/refresh', { method: 'POST' });
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
      const setCookieHeader = refreshRes.headers.get('set-cookie');
      for (const c of splitSetCookies(setCookieHeader)) {
        const rtVal = pickCookieValue(c, REFRESH_TOKEN_COOKIE); // 'RP_REFRESH'
        if (rtVal) {
          cookiesToSet.push({
            name: REFRESH_TOKEN_COOKIE,
            value: rtVal,
            maxAge: pickMaxAge(c),
          });
        }
      }

      // 새 AT/RT 심은 뒤 실제 데이터 재조회
      beRes = await backendFetch('/users/me', {
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
          ...(ck.maxAge ? { maxAge: ck.maxAge } : {}),
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
