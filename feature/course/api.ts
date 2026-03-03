import { bffFetch } from '@/lib/bffFetch';
import type { ApiResult } from '@/types/http';
import type {
  CourseRecommendationRequest,
  CourseRecommendationResponse,
} from '@/feature/course/types';

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
