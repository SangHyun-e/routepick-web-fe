import type {
  PostCreateRequest,
  PostListItemResponse,
  PostResponse,
  PostUpdateRequest,
  PaginatedResponse,
} from '@/feature/post/types';
import type { ApiResult } from '@/types/http';
import { bffFetch } from '@/lib/bffFetch';

function buildQuery(params: Record<string, string | number | undefined>) {
  const entries = Object.entries(params).filter(([, value]) => value !== undefined);
  const converted = entries.map(([key, value]) => [key, String(value)] as [string, string]);
  return new URLSearchParams(converted).toString();
}

function normalizePage<T>(raw: unknown): PaginatedResponse<T> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const r = raw as any;
  const content = Array.isArray(r?.content) ? (r.content as T[]) : [];
  return {
    content,
    number: Number.isFinite(r?.number) ? r.number : 0,
    size: Number.isFinite(r?.size) ? r.size : content.length,
    totalElements: Number.isFinite(r?.totalElements) ? r.totalElements : content.length,
    totalPages: Number.isFinite(r?.totalPages) ? r.totalPages : 1,
    first: Boolean(r?.first),
    last: Boolean(r?.last),
    numberOfElements: Number.isFinite(r?.numberOfElements) ? r.numberOfElements : content.length,
    empty: content.length === 0,
  };
}

async function readErrorMessage(res: Response, fallback: string): Promise<string> {
  // 1) JSON {message} 우선
  try {
    const json = await res.clone().json();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const msg = (json as any)?.message;
    if (typeof msg === 'string' && msg.trim().length > 0) return msg;
  } catch {
    // ignore
  }

  // 2) text fallback
  try {
    const text = await res.clone().text();
    if (typeof text === 'string' && text.trim().length > 0) return text;
  } catch {
    // ignore
  }

  return fallback;
}

/** 게시물 목록 조회 */
export async function fetchPosts(
  page = 0,
  size = 20,
): Promise<ApiResult<PaginatedResponse<PostListItemResponse>>> {
  const query = buildQuery({ page, size });
  const res = await bffFetch(`/api/proxy/posts?${query}`, { cache: 'no-store' });

  if (!res.ok) {
    const message = await readErrorMessage(
      res,
      `게시글 목록을 불러오지 못했습니다. (${res.status})`,
    );
    return { ok: false, status: res.status, message };
  }

  const raw = await res.json().catch(() => ({}));
  const data = normalizePage<PostListItemResponse>(raw);
  return { ok: true, data };
}

/** 단일 게시글 조회 */
export async function fetchPost(id: number): Promise<ApiResult<PostResponse>> {
  const res = await bffFetch(`/api/proxy/posts/${id}`, { cache: 'no-store' });

  if (!res.ok) {
    const message = await readErrorMessage(res, `게시글을 불러오지 못했습니다. (${res.status})`);
    return { ok: false, status: res.status, message };
  }

  const data = (await res.json()) as PostResponse;
  return { ok: true, data };
}

/** 게시글 생성 */
export async function createPost(payload: PostCreateRequest): Promise<ApiResult<PostResponse>> {
  const res = await bffFetch('/api/proxy/posts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const message = await readErrorMessage(res, '게시글 생성 실패');
    return { ok: false, status: res.status, message };
  }

  const data = (await res.json()) as PostResponse;
  return { ok: true, data };
}

/** 게시글 수정 */
export async function updatePost(
  id: number,
  payload: PostUpdateRequest,
): Promise<ApiResult<PostResponse>> {
  const res = await bffFetch(`/api/proxy/posts/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const message = await readErrorMessage(res, '게시글 수정 실패');
    return { ok: false, status: res.status, message };
  }

  const data = (await res.json()) as PostResponse;
  return { ok: true, data };
}

/** 게시글 삭제 */
export async function deletePost(id: number): Promise<ApiResult<null>> {
  const res = await bffFetch(`/api/proxy/posts/${id}`, { method: 'DELETE' });

  if (!res.ok) {
    const message = await readErrorMessage(res, '게시글 삭제 실패');
    return { ok: false, status: res.status, message };
  }

  return { ok: true, data: null };
}
