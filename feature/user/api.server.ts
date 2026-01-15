import { bffFetch } from '@/lib/bffFetch';
import type { ApiResult } from '@/types/http';
import type { Me } from '@/types/user';

/**
 * 서버에서 현재 로그인한 사용자 정보를 조회합니다
 * @returns 사용자 정보 또는 에러
 */
export async function fetchMeServer(): Promise<ApiResult<Me>> {
  const res = await bffFetch('/api/proxy/users/me', { cache: 'no-store' });

  if (!res.ok) {
    return {
      ok: false,
      status: res.status,
      message: '사용자 정보를 불러오지 못했습니다.',
    };
  }

  const data = (await res.json()) as Me;
  return { ok: true, data };
}
