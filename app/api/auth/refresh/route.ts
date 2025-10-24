// app/api/auth/refresh/route.ts
import { NextResponse } from 'next/server';
import { backendFetch } from '@/lib/backendFetch';
import { ACCESS_TOKEN_COOKIE, expiredCookieOptions } from '@/lib/cookies';

function extractCookieValue(allSetCookie: string, name: string) {
  // 여러 개의 Set-Cookie가 하나의 헤더 문자열에 합쳐질 수 있으니 쪼갠다.
  const cookies = allSetCookie.split(/,(?=\s*[A-Za-z0-9_-]+=)/);
  const target = cookies.find((c) =>
    c
      .trim()
      .toLowerCase()
      .startsWith(name.toLowerCase() + '='),
  );
  if (!target) return null;
  const firstSegment = target.split(';', 1)[0];
  const equalsIndex = firstSegment.indexOf('=');
  if (equalsIndex < 0) return '';
  return firstSegment.slice(equalsIndex + 1);
}

function extractMaxAge(allSetCookie: string, name: string) {
  const cookies = allSetCookie.split(/,(?=\s*[A-Za-z0-9_-]+=)/);
  const target = cookies.find((c) =>
    c
      .trim()
      .toLowerCase()
      .startsWith(name.toLowerCase() + '='),
  );
  if (!target) return undefined;
  const m = target.match(/max-age=(\d+)/i);
  return m ? parseInt(m[1], 10) : undefined;
}

export async function POST() {
  const beRes = await backendFetch('/auth/refresh', { method: 'POST' });
  const text = await beRes.text();

  const res = new NextResponse(text, {
    status: beRes.status,
    headers: { 'content-type': beRes.headers.get('content-type') ?? 'application/json' },
  });

  // 1) 백엔드 바디에서 access 뽑아 rp_at 심기
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
    // 실패면 rp_at 제거
    res.cookies.set(ACCESS_TOKEN_COOKIE, '', expiredCookieOptions);
  }

  // 2) 백엔드 Set-Cookie에서 RP_REFRESH 값만 추출해서
  //    프론트(origin) 스코프로 다시 심는다(도메인 불일치 방지).
  const setCookie = beRes.headers.get('set-cookie');
  if (setCookie) {
    const refreshVal = extractCookieValue(setCookie, 'RP_REFRESH');
    if (refreshVal !== null) {
      const refreshMaxAge = extractMaxAge(setCookie, 'RP_REFRESH');
      res.cookies.set('RP_REFRESH', refreshVal, {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        ...(refreshMaxAge !== undefined ? { maxAge: refreshMaxAge } : {}),
      });
    }
  }

  return res;
}
