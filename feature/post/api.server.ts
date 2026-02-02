import type { ApiResult } from '@/types/http';
import type { PostResponse } from '@/feature/post/types';
import { be } from '@/lib/be';

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

export async function fetchPostServer(id: number): Promise<ApiResult<PostResponse>> {
  const res = await be(`/posts/${id}`, { method: 'GET' });

  if (!res.ok) {
    const message = await readErrorMessage(res, `게시글을 불러오지 못했습니다. (${res.status})`);
    return { ok: false, status: res.status, message };
  }

  const data = (await res.json()) as PostResponse;
  return { ok: true, data };
}
