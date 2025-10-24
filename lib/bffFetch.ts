let refreshPromise: Promise<Response> | null = null;

async function callRefresh() {
  if (!refreshPromise) {
    refreshPromise = fetch('/api/auth/refresh', {
      method: 'POST',
      credentials: 'include',
      cache: 'no-store',
    }).finally(() => (refreshPromise = null));
  }
  return refreshPromise;
}

export async function bffFetch(input: RequestInfo, init: RequestInit = {}) {
  const doFetch = () => fetch(input, { ...init, credentials: 'include', cache: 'no-store' });

  const res = await doFetch();
  if (res.status !== 401) return res;

  const r = await callRefresh();
  if (!r.ok) return res;
  return doFetch();
}
