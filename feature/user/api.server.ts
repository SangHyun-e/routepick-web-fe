/** 게시글 상세 SSR에서 작성자인지 판단
 * 서버에서 /user/me 조회
 *
 * - 로그인 X: 401 -> ok: false 반환
 * - 로그인 O: 200 -> ok: true + Me 반환
 */

import { bffFetch } from '@/lib/bffFetch';
import { ApiResult } from '@/types/http';
import { Me } from '@/types/user';

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
