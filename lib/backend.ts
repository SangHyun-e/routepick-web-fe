import { cookies } from 'next/headers';

export function withAuth(init: RequestInit = {}): RequestInit {
  const c = cookies();
  const at = c.get('rp_at')?.value;
  const headers = new Headers(init.headers);
  if (at) headers.set('Authorization', `Bearer ${at}`);
  return { ...init, headers };
}
