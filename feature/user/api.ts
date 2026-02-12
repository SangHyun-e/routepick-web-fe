import { bffFetch } from '@/lib/bffFetch';
import type { ApiResult } from '@/types/http';

export async function withdrawUser(): Promise<ApiResult<void>> {
  const res = await bffFetch('/api/proxy/users/me', { method: 'DELETE' });

  if (!res.ok) {
    const message = await res
      .json()
      .then((body) => body?.message as string | undefined)
      .catch(() => undefined);
    return {
      ok: false,
      status: res.status,
      message: message ?? '회원 탈퇴에 실패했습니다.',
    };
  }

  return { ok: true, data: undefined };
}

export async function verifyPassword(password: string): Promise<ApiResult<void>> {
  const res = await bffFetch('/api/proxy/users/me/verify-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password }),
  });

  if (!res.ok) {
    const message = await res
      .json()
      .then((body) => body?.message as string | undefined)
      .catch(() => undefined);
    return {
      ok: false,
      status: res.status,
      message: message ?? '비밀번호 확인에 실패했습니다.',
    };
  }

  return { ok: true, data: undefined };
}
