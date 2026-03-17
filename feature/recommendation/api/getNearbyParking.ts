import { bffFetch } from '@/lib/bffFetch';
import type { ApiResult } from '@/types/http';
import type { NearbyParkingItem } from '../types/recommendation';

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

export async function getNearbyParking(
  lat: number,
  lng: number,
): Promise<ApiResult<NearbyParkingItem[]>> {
  const params = new URLSearchParams();
  params.set('lat', String(lat));
  params.set('lng', String(lng));

  const res = await bffFetch(`/api/proxy/api/parking/nearby?${params.toString()}`);

  if (!res.ok) {
    const message = await readErrorMessage(res, '근처 주차장 정보를 불러오지 못했어요.');
    return { ok: false, status: res.status, message };
  }

  const data = (await res.json()) as NearbyParkingItem[];
  return { ok: true, data };
}
