// lib/bffFetch.ts
let refreshPromise: Promise<Response> | null = null;
const REFRESH_URL = '/api/auth/refresh';

// 서버에서 상대경로를 절대 URL로 바꿔주는 헬퍼
function makeAbsolute(input: RequestInfo): RequestInfo {
  // Request 객체면 그대로
  if (typeof input !== 'string') return input;

  // 이미 http(s)면 그대로
  if (input.startsWith('http://') || input.startsWith('https://')) return input;

  // 브라우저에서는 상대경로 그대로 써도 됨
  if (typeof window !== 'undefined') return input;

  // 서버에서는 origin 기준으로 절대 URL로 변환
  const origin =
    process.env.NEXT_PUBLIC_SITE_URL ?? process.env.SITE_URL ?? 'http://localhost:3000';

  // 앞에 / 없으면 붙여주기
  const path = input.startsWith('/') ? input : `/${input}`;
  return origin + path;
}

async function callRefresh() {
  if (!refreshPromise) {
    const refreshUrl = makeAbsolute(REFRESH_URL);
    refreshPromise = fetch(refreshUrl, {
      method: 'POST',
      credentials: 'include',
      cache: 'no-store',
      headers: { 'x-bff-refresh': '1' }, // 로깅/디버깅용
    }).finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

export async function bffFetch(input: RequestInfo, init: RequestInit = {}) {
  const absInput = makeAbsolute(input);
  const url = typeof absInput === 'string' ? absInput : (absInput as Request).url;
  const isRefresh = url.includes('/api/auth/refresh');

  const doFetch = () =>
    fetch(absInput, {
      cache: init.cache ?? 'no-store',
      credentials: init.credentials ?? 'include',
      ...init,
    });

  const res = await doFetch();
  if (res.status !== 401 || isRefresh) return res;

  const r = await callRefresh();
  if (!r.ok) return res; // 리프레시 실패 → 원래 401 그대로
  return doFetch(); // 성공 → 동일 요청 재시도
}
