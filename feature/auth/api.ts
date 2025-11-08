// feature/auth/api.ts
import { LoginPayload } from '@/feature/auth/types';
import { ApiResult } from '@/types/http';

export async function login(payload: LoginPayload): Promise<ApiResult> {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    cache: 'no-store',
    body: JSON.stringify(payload),
  });

  if (res.ok) return { ok: true };
  if (res.status === 401 || res.status === 400) {
    return { ok: false, message: '이메일 또는 비밀번호가 올바르지 않습니다.' };
  }
  const err = await res.json().catch(() => null);
  return { ok: false, message: err?.message ?? '로그인 중 오류가 발생했습니다.' };
}

export async function logout(): Promise<void> {
  await fetch('/api/auth/logout', {
    method: 'POST',
    credentials: 'include',
    cache: 'no-store',
  });
}
