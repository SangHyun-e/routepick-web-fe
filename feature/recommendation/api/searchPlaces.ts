import { bffFetch } from '@/lib/bffFetch';
import type { ApiResult } from '@/types/http';
import type { Place, PlaceSearchResponse } from '../types/place';

type KakaoPlaceDocument = {
  id: string;
  placeName?: string;
  addressName?: string;
  roadAddressName?: string;
  x: string;
  y: string;
};

type KakaoPlaceSearchResponse = {
  documents: KakaoPlaceDocument[];
};

export async function searchPlaces(keyword: string): Promise<ApiResult<PlaceSearchResponse>> {
  const trimmed = keyword.trim();
  if (!trimmed) {
    return { ok: true, data: { keyword: trimmed, results: [] } };
  }

  const params = new URLSearchParams({ keyword: trimmed, size: '10' });
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
  const results = (data.documents ?? [])
    .map((doc) => {
      const lat = Number(doc.y);
      const lng = Number(doc.x);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
        return null;
      }
      const place: Place = {
        id: doc.id,
        name: doc.placeName ?? '',
        address: doc.roadAddressName || doc.addressName || '',
        lat,
        lng,
      };
      return place;
    })
    .filter((place): place is Place => Boolean(place));

  return { ok: true, data: { keyword: trimmed, results } };
}
