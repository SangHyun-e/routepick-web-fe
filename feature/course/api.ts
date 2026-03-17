import { bffFetch } from '@/lib/bffFetch';
import type { ApiResult } from '@/types/http';
import type {
  CourseRecommendationRequest,
  CourseRecommendationResponse,
  CourseRecommendationSaveRequest,
  CourseRecommendationSaveResponse,
} from '@/feature/course/types';
import type { PaginatedResponse } from '@/feature/post/types';

async function readErrorMessage(res: Response, fallback: string): Promise<string> {
  try {
    const json = await res.clone().json();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const msg = (json as any)?.message;
    if (typeof msg === 'string' && msg.trim().length > 0) return msg;
  } catch {
    // ignore
  }

  try {
    const text = await res.clone().text();
    if (typeof text === 'string' && text.trim().length > 0) return text;
  } catch {
    // ignore
  }

  return fallback;
}

export async function recommendCourse(
  payload: CourseRecommendationRequest,
): Promise<ApiResult<CourseRecommendationResponse>> {
  const res = await bffFetch('/api/proxy/courses/recommend', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const message = await readErrorMessage(res, '코스 추천에 실패했습니다.');
    return { ok: false, status: res.status, message };
  }

  const data = (await res.json()) as CourseRecommendationResponse;
  return { ok: true, data };
}

export async function saveRecommendation(
  payload: CourseRecommendationSaveRequest,
): Promise<ApiResult<CourseRecommendationSaveResponse>> {
  const res = await bffFetch('/api/proxy/courses/saved', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const message = await readErrorMessage(res, '추천 코스 저장에 실패했습니다.');
    return { ok: false, status: res.status, message };
  }

  const data = (await res.json()) as CourseRecommendationSaveResponse;
  return { ok: true, data };
}

function normalizePage<T>(raw: unknown): PaginatedResponse<T> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = raw as any;
  const content = Array.isArray(result?.content) ? (result.content as T[]) : [];
  return {
    content,
    number: Number.isFinite(result?.number) ? result.number : 0,
    size: Number.isFinite(result?.size) ? result.size : content.length,
    totalElements: Number.isFinite(result?.totalElements) ? result.totalElements : content.length,
    totalPages: Number.isFinite(result?.totalPages) ? result.totalPages : 1,
    first: Boolean(result?.first),
    last: Boolean(result?.last),
    numberOfElements: Number.isFinite(result?.numberOfElements)
      ? result.numberOfElements
      : content.length,
    empty: content.length === 0,
  };
}

export async function fetchSavedRecommendations(
  page = 0,
  size = 5,
): Promise<ApiResult<PaginatedResponse<CourseRecommendationSaveResponse>>> {
  const params = new URLSearchParams();
  params.set('page', String(page));
  params.set('size', String(size));
  params.append('sort', 'createdAt,desc');

  const res = await bffFetch(`/api/proxy/courses/saved?${params.toString()}`, {
    cache: 'no-store',
  });

  if (!res.ok) {
    const message = await readErrorMessage(res, '저장된 추천 코스를 불러오지 못했습니다.');
    return { ok: false, status: res.status, message };
  }

  const raw = await res.json().catch(() => ({}));
  const data = normalizePage<CourseRecommendationSaveResponse>(raw);
  return { ok: true, data };
}

export async function deleteSavedRecommendation(id: number): Promise<ApiResult<null>> {
  const res = await bffFetch(`/api/proxy/courses/saved/${id}`, {
    method: 'DELETE',
  });

  if (!res.ok) {
    const message = await readErrorMessage(res, '저장된 추천 코스 삭제에 실패했습니다.');
    return { ok: false, status: res.status, message };
  }

  return { ok: true, data: null };
}
