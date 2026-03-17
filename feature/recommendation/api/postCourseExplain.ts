import { bffFetch } from '@/lib/bffFetch';
import type { ApiResult } from '@/types/http';
import type { CourseExplainResponse } from '../types/recommendation';

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

export async function postCourseExplain(
  courseId: number,
): Promise<ApiResult<CourseExplainResponse>> {
  const res = await bffFetch(`/api/proxy/api/courses/${courseId}/explain`, {
    method: 'POST',
  });

  if (!res.ok) {
    const message = await readErrorMessage(res, 'AI 설명을 불러오지 못했습니다.');
    return { ok: false, status: res.status, message };
  }

  const data = (await res.json()) as CourseExplainResponse;
  return { ok: true, data };
}
