import type { ApiResult } from '@/types/http';
import type { PostResponse } from '@/feature/post/types';
import { headers } from 'next/headers';

async function readErrorMessage(res: Response, fallback: string): Promise<string> {
  try {
    const json = await res.clone().json();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const msg = (json as any)?.message;
    if (typeof msg === 'string' && msg.trim().length > 0) return msg;
  } catch {
    /* ignore */
  }

  try {
    const text = await res.clone().text();
    if (typeof text === 'string' && text.trim().length > 0) return text;
  } catch {
    /* ignore  */
  }

  return fallback;
}

/**
 * 서버에서 현재 요청 기준 origin(프로토콜+호스트) 만들기
 * - 배포/프록시 환경 대응: x-forwarded-* 우선
 */
function getRequestOriginFromHeaders(h: Headers): string {
  const fallbackOrigin = process.env.NEXT_PUBLIC_SITE_URL ?? process.env.SITE_URL;
  const fallbackHost = fallbackOrigin ? new URL(fallbackOrigin).host : '';
  const host = h.get('x-forwarded-host') ?? h.get('host') ?? fallbackHost;

  const proto = h.get('x-forwarded-proto') ?? 'http';
  return `${proto}://${host}`;
}

export async function fetchPostServer(id: number): Promise<ApiResult<PostResponse>> {
  const h = await headers();
  const cookie = h.get('cookie') ?? '';

  const hasViewed = cookie.includes(`rp_view_${id}=`);
  const incView = hasViewed ? 'false' : 'true';

  const origin = getRequestOriginFromHeaders(h);
  const url = new URL(`/api/proxy/posts/${id}`, origin);
  url.searchParams.set('incView', incView);

  const res = await fetch(url.toString(), {
    method: 'GET',
    cache: 'no-store',
    headers: cookie ? { cookie } : undefined,
  });

  if (!res.ok) {
    const message = await readErrorMessage(res, `게시글을 불러오지 못했습니다. (${res.status})`);
    return { ok: false, status: res.status, message };
  }

  const data = (await res.json()) as PostResponse;
  return { ok: true, data };
}
