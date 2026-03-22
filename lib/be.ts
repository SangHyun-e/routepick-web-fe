import { ACCESS_TOKEN_COOKIE } from '@/lib/cookies';
import { SERVER_BASE_URL } from '@/lib/env';
import { cookies, headers as nextHeaders } from 'next/headers';

function isJwt(token?: string | null) {
  if (!token) return false;
  const t = token.trim();
  if (!t || t === 'undefined' || t === 'null') return false;
  return (t.match(/\./g)?.length ?? 0) === 2;
}

type BeRequestInit = RequestInit & { skipAuth?: boolean };

export async function be(path: string, init: BeRequestInit = {}) {
  const { skipAuth, ...fetchInit } = init;
  const h = new Headers(fetchInit.headers || {});

  const cookieStore = await cookies();
  const headersList = await nextHeaders();

  // 1) AT 자동 부착
  if (skipAuth) {
    h.delete('Authorization');
  } else if (!h.has('Authorization')) {
    const at = cookieStore.get(ACCESS_TOKEN_COOKIE)?.value;
    if (isJwt(at)) h.set('Authorization', `Bearer ${at}`);
  }
  // 2) 클라에서 온 Cookie(= RT 포함) 전달
  const reqCookie = headersList.get('cookie');
  if (reqCookie) h.set('Cookie', reqCookie);

  return fetch(`${SERVER_BASE_URL}${path}`, {
    ...fetchInit,
    headers: h,
    cache: 'no-store',
    redirect: 'manual',
  });
}
