import { bffFetch } from '@/lib/bffFetch';
import type { ApiResult } from '@/types/http';
import type { KakaoPlaceSearchResponse } from '@/feature/place/types';

export async function searchPlaces(keyword: string): Promise<ApiResult<KakaoPlaceSearchResponse>> {
  const params = new URLSearchParams({ keyword });
  const res = await bffFetch(`/api/proxy/places/search?${params.toString()}`, {
    cache: 'no-store',
  });

  if (!res.ok) {
    const err = await res.json().catch(() => null);
    return {
      ok: false,
      status: res.status,
      message: err?.message ?? '장소 검색에 실패했습니다.',
    };
  }

  const data = (await res.json()) as KakaoPlaceSearchResponse;
  return { ok: true, data };
}
