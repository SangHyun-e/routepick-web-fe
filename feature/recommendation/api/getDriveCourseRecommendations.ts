import { bffFetch } from '@/lib/bffFetch';
import type { ApiResult } from '@/types/http';
import type { RecommendationQueryParams, RecommendationResponse } from '../types/recommendation';

type ApiErrorBody = { message?: string };

const SERVER_ERROR_MESSAGE = '코스를 불러오지 못했습니다.';
const CLIENT_ERROR_MESSAGE = '추천 요청을 처리하지 못했습니다.';

async function readErrorMessage(res: Response, fallback: string): Promise<string> {
  try {
    const body = (await res.clone().json()) as ApiErrorBody | null;
    if (body?.message) {
      return body.message;
    }
  } catch {
    // ignore
  }

  return fallback;
}

export async function getDriveCourseRecommendations(
  params: RecommendationQueryParams,
): Promise<ApiResult<RecommendationResponse>> {
  const searchParams = new URLSearchParams();
  searchParams.set('originLat', String(params.originLat));
  searchParams.set('originLng', String(params.originLng));

  if (params.theme) {
    searchParams.set('theme', params.theme);
  }
  if (typeof params.durationMinutes === 'number') {
    searchParams.set('durationMinutes', String(params.durationMinutes));
  }
  if (typeof params.maxStops === 'number') {
    searchParams.set('maxStops', String(params.maxStops));
  }
  if (typeof params.weatherAware === 'boolean') {
    searchParams.set('weatherAware', String(params.weatherAware));
  }
  if (typeof params.destinationLat === 'number') {
    searchParams.set('destinationLat', String(params.destinationLat));
  }
  if (typeof params.destinationLng === 'number') {
    searchParams.set('destinationLng', String(params.destinationLng));
  }

  const res = await bffFetch(
    `/api/proxy/api/recommendations/drive-courses?${searchParams.toString()}`,
  );

  if (!res.ok) {
    if (res.status >= 500) {
      return { ok: false, status: res.status, message: SERVER_ERROR_MESSAGE };
    }
    const message = await readErrorMessage(res, CLIENT_ERROR_MESSAGE);
    return { ok: false, status: res.status, message };
  }

  const data = (await res.json()) as RecommendationResponse;
  return { ok: true, data };
}
