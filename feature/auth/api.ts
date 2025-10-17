import { ApiResult, LoginPayload } from '@/feature/auth/types';

export async function login(payload: LoginPayload): Promise<ApiResult> {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    cache: 'no-store',
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => null);
    return { ok: false, message: err?.message ?? 'Login failed' };
  }
  return { ok: true };
}

export async function logout(): Promise<void> {
  await fetch('/api/auth/logout', { method: 'POST' });
}
