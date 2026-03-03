import { bffFetch } from '@/lib/bffFetch';
import type { ApiResult } from '@/types/http';
import type { DrivePlanRequest, DrivePlanResponse } from '@/feature/drive/types';

async function readErrorMessage(res: Response, fallback: string): Promise<string> {
  try {
    const json = await res.clone().json();
    const msg = (json as { message?: unknown }).message;
    if (typeof msg === 'string' && msg.trim().length > 0) return msg;
  } catch {
  }

  try {
    const text = await res.clone().text();
    if (typeof text === 'string' && text.trim().length > 0) return text;
  } catch {
  }

  return fallback;
}

export async function createDrivePlan(
  payload: DrivePlanRequest,
): Promise<ApiResult<DrivePlanResponse>> {
  const res = await bffFetch('/api/proxy/drive/plan', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const message = await readErrorMessage(res, '코스 생성에 실패했습니다.');
    return { ok: false, status: res.status, message };
  }

  const data = (await res.json()) as DrivePlanResponse;
  return { ok: true, data };
}
