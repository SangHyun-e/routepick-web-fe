import {
  PostCreateRequest,
  PostListItemResponse,
  PostResponse,
  PostUpdateRequest,
} from '@/feature/post/types';
import { ApiResult } from '@/types/http';

/** 게시물 목록 조회 */
export async function fetchPosts(): Promise<ApiResult<PostListItemResponse[]>> {
  const res = await fetch('/api/procy/posts', {
    cache: 'no-store',
    credentials: 'include',
  });

  if (!res.ok) {
    return { ok: false, message: `게시글 목록을 불러오지 못했습니다. (${res.status})` };
  }

  const data = (await res.json()) as PostListItemResponse[];
  return { ok: true, data };
}
/** 단일 게시글 조회 */
export async function fetchPost(id: number): Promise<ApiResult<PostResponse>> {
  const res = await fetch(`/api/proxy/posts/${id}`, {
    cache: 'no-store',
    credentials: 'include',
  });

  if (!res.ok) {
    return { ok: false, message: `게시글을 불러오지 못했습니다. (${res.status})` };
  }

  const data = (await res.json()) as PostResponse;
  return { ok: true, data };
}

/** 게시글 생성 */
export async function createPost(payload: PostCreateRequest): Promise<ApiResult<PostResponse>> {
  const res = await fetch('/api/proxy/posts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
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
  const res = await fetch(`/api/proxy/posts/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
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
  const res = await fetch(`/api/proxy/posts/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  });

  if (!res.ok) {
    const err = await res.json().catch(() => null);
    return { ok: false, message: err?.message ?? '게시글 삭제 실패' };
  }

  return { ok: true, data: null };
}
