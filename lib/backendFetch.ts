// lib/backendFetch.ts
import { cookies, headers as nextHeaders } from 'next/headers';
import { SERVER_BASE_URL } from '@/lib/env';
import { ACCESS_TOKEN_COOKIE } from '@/lib/cookies';

function isValidJwt(token?: string | null) {
  if (!token) return false;
  const t = token.trim().toLowerCase();
  if (!t || t === 'undefined' || t === 'null') return false;
  return (token.match(/\./g)?.length ?? 0) === 2;
}

export function getSetCookies(res: Response): string[] {
  // 노드 fetch가 여러 Set-Cookie를 콤마로 합치는 케이스까지 커버
  const raw = res.headers.get('set-cookie');
  if (!raw) return [];
  // 다음 쿠키의 name= 시작 위치에서만 분리 (Expires=의 콤마 무시)
  return raw.split(/,(?=\s*[-A-Za-z0-9!#$%&'*+.^_`|~]+=[^;]+)/);
}

export async function backendFetch(path: string, init: RequestInit = {}) {
  const h = new Headers(init.headers || {});
  if (!h.has('Authorization')) {
    const access = cookies().get(ACCESS_TOKEN_COOKIE)?.value;
    if (isValidJwt(access)) h.set('Authorization', `Bearer ${access}`);
  }
  const reqCookie = nextHeaders().get('cookie');
  if (reqCookie) h.set('Cookie', reqCookie);

  return fetch(`${SERVER_BASE_URL}${path}`, {
    ...init,
    headers: h,
    cache: 'no-store',
    redirect: 'manual',
  });
}
