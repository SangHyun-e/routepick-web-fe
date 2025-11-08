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

/** 게시물 목록 조회 */
export async function fetchPosts(
  page = 0,
  size = 20,
): Promise<ApiResult<PaginatedResponse<PostListItemResponse>>> {
  const query = buildQuery({ page, size });
  const res = await bffFetch(`/api/proxy/posts?${query}`, { cache: 'no-store' });

  if (!res.ok) {
    return { ok: false, message: `게시글 목록을 불러오지 못했습니다. (${res.status})` };
  }

  const json = (await res.json()) as PaginatedResponse<PostListItemResponse>;
  return { ok: true, data: json };
}

/** 단일 게시글 조회 */
export async function fetchPost(id: number): Promise<ApiResult<PostResponse>> {
  const res = await bffFetch(`/api/proxy/posts/${id}`, { cache: 'no-store' });

  if (!res.ok) {
    return { ok: false, message: `게시글을 불러오지 못했습니다. (${res.status})` };
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
    const err = await res.json().catch(() => null);
    return { ok: false, message: err?.message ?? '게시글 생성 실패' };
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
    const err = await res.json().catch(() => null);
    return { ok: false, message: err?.message ?? '게시글 수정 실패' };
  }

  const data = (await res.json()) as PostResponse;
  return { ok: true, data };
}

/** 게시글 삭제 */
export async function deletePost(id: number): Promise<ApiResult<null>> {
  const res = await bffFetch(`/api/proxy/posts/${id}`, { method: 'DELETE' });

  if (!res.ok) {
    const err = await res.json().catch(() => null);
    return { ok: false, message: err?.message ?? '게시글 삭제 실패' };
  }

  return { ok: true, data: null };
}
