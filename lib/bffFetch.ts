// lib/bffFetch.ts
let refreshPromise: Promise<Response> | null = null;
const REFRESH_URL = '/api/auth/refresh';

async function getServerOrigin(): Promise<string> {
  if (typeof window !== 'undefined') return '';
  const envOrigin = process.env.NEXT_PUBLIC_SITE_URL ?? process.env.SITE_URL ?? '';

  const mod = await import('next/headers');
  const h = mod.headers();
  const host = h.get('x-forwarded-host') ?? h.get('host');
  const fallbackProto = envOrigin ? new URL(envOrigin).protocol.replace(':', '') : 'http';
  const proto = h.get('x-forwarded-proto') ?? fallbackProto;

  if (host) {
    return `${proto}://${host}`;
  }

  return envOrigin;
}

async function makeAbsolute(input: string | Request | URL): Promise<string | Request | URL> {
  if (typeof input !== 'string') return input;
  if (input.startsWith('http://') || input.startsWith('https://')) return input;
  if (typeof window !== 'undefined') return input;

  const origin = await getServerOrigin();
  const path = input.startsWith('/') ? input : `/${input}`;
  return origin ? origin + path : path;
}

async function getServerCookieHeader(): Promise<string> {
  if (typeof window !== 'undefined') return '';
  const mod = await import('next/headers');
  const h = mod.headers();
  return h.get('cookie') ?? '';
}

function mergeHeaders(
  initHeaders: RequestInit['headers'],
  cookieHeader: string,
): HeadersInit | undefined {
  const base = new Headers(initHeaders);

  if (!base.has('cookie') && cookieHeader) {
    base.set('cookie', cookieHeader);
  }
  return base;
}

async function callRefresh() {
  if (!refreshPromise) {
    const refreshUrl = await makeAbsolute(REFRESH_URL);
    refreshPromise = fetch(refreshUrl, {
      method: 'POST',
      credentials: 'include',
      cache: 'no-store',
      headers: { 'x-bff-refresh': '1' },
    }).finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

/**
 * BFF(Backend for Frontend) fetch wrapper
 * - 401 에러 발생 시 자동으로 토큰 리프레시 시도
 * - 서버/클라이언트 양쪽에서 동작
 */
export async function bffFetch(input: string | Request | URL, init: RequestInit = {}) {
  const absInput = await makeAbsolute(input);
  const url = typeof absInput === 'string' ? absInput : (absInput as Request).url;
  const isRefresh = url.includes('/api/auth/refresh');

  const doFetch = async () => {
    const cookieHeader = await getServerCookieHeader();
    return fetch(absInput, {
      cache: init.cache ?? 'no-store',
      credentials: init.credentials ?? 'include',
      ...init,
      headers: mergeHeaders(init.headers, cookieHeader),
    });
  };

  const res = await doFetch();

  if (res.status !== 401 || isRefresh) return res;

  const r = await callRefresh();
  if (!r.ok) return res; // 리프레시 실패 → 원래 401 그대로

  return doFetch();
}
