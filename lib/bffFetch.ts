let refreshPromise: Promise<Response> | null = null;
const REFRESH_URL = '/api/proxy/auth/refresh';

async function callRefresh() {
  if (!refreshPromise) {
    refreshPromise = fetch(REFRESH_URL, {
      method: 'POST',
      credentials: 'include',
      cache: 'no-store',
      headers: { 'x-bff-refresh': '1' }, // 로깅/디버깅용
    }).finally(() => (refreshPromise = null));
  }
  return refreshPromise;
}

export async function bffFetch(input: RequestInfo, init: RequestInit = {}) {
  const url = typeof input === 'string' ? input : (input as Request).url;
  const isRefresh = url.includes('/api/proxy/auth/refresh');

  const doFetch = () =>
    fetch(input, {
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
