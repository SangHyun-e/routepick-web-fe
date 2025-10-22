export async function bffFetch(input: RequestInfo, init?: RequestInit): Promise<Response> {
  let res = await fetch(input, init);
  if (res.status === 401) {
    const r = await fetch('/api/auth/refresh', { method: 'POST', cache: 'no-store' });
    if (r.ok) res = await fetch(input, init);
  }
  return res;
}
