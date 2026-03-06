import { bffFetch } from '@/lib/bffFetch';
import type { ApiResult } from '@/types/http';
import type { DriveWeatherResponse } from '@/feature/weather/types';

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

export async function fetchDriveWeatherMessage(
  lat: number,
  lng: number,
  fallback = false,
): Promise<ApiResult<DriveWeatherResponse>> {
  const params = new URLSearchParams();
  params.set('lat', String(lat));
  params.set('lng', String(lng));
  if (fallback) params.set('fallback', 'true');

  const res = await bffFetch(`/api/proxy/weather/drive-message?${params.toString()}`, {
    cache: 'no-store',
  });

  if (!res.ok) {
    const message = await readErrorMessage(res, '날씨 정보를 불러오지 못했습니다.');
    return { ok: false, status: res.status, message };
  }

  const data = (await res.json()) as DriveWeatherResponse;
  return { ok: true, data };
}
