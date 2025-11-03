import { ACCESS_TOKEN_COOKIE } from '@/lib/cookies';
import { SERVER_BASE_URL } from '@/lib/env';
import { cookies, headers as nextHeaders } from 'next/headers';

function isJwt(token?: string | null) {
  if (!token) return false;
  const t = token.trim();
  if (!t || t === 'undefined' || t === 'null') return false;
  return (t.match(/\./g)?.length ?? 0) === 2;
}

export async function be(path: string, init: RequestInit = {}) {
  const h = new Headers(init.headers || {});
  // 1) AT 자동 부착
  if (!h.has('Authorization')) {
    const at = cookies().get(ACCESS_TOKEN_COOKIE)?.value;
    if (isJwt(at)) h.set('Authorization', `Bearer ${at}`);
  }
  // 2) 클라에서 온 Cookie(= RT 포함) 전달
  const reqCookie = nextHeaders().get('cookie');
  if (reqCookie) h.set('Cookie', reqCookie);

  return fetch(`${SERVER_BASE_URL}${path}`, {
    ...init,
    headers: h,
    cache: 'no-store',
    redirect: 'manual',
  });
}

// 백엔드 Set-Cookie 여러 개를 안전하게 분리
export function splitSetCookies(res: Response): string[] {
  const raw = res.headers.get('set-cookie');
  if (!raw) return [];
  return raw.split(/,(?=\s*[-A-Za-z0-9!#$%&'*+.^_`|~]+=[^;]+)/);
}
