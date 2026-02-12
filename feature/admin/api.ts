import { bffFetch } from '@/lib/bffFetch';
import type { ApiResult } from '@/types/http';
import type { PaginatedResponse, PostListItemResponse } from '@/feature/post/types';

async function readErrorMessage(res: Response, fallback: string): Promise<string> {
  try {
    const json = await res.clone().json();
    const msg = (json as { message?: string })?.message;
    if (msg) return msg;
  } catch {
    // ignore
  }

  try {
    const text = await res.clone().text();
    if (text) return text;
  } catch {
    // ignore
  }

  return fallback;
}

export async function fetchAdminPosts(
  page = 0,
  size = 20,
  status?: string,
  keyword?: string,
): Promise<ApiResult<PaginatedResponse<PostListItemResponse>>> {
  const params = new URLSearchParams();
  params.set('page', String(page));
  params.set('size', String(size));
  if (status && status !== 'ALL') {
    params.set('status', status);
  }
  if (keyword) {
    params.set('keyword', keyword);
  }

  const res = await bffFetch(`/api/proxy/admin/posts?${params.toString()}`, {
    cache: 'no-store',
  });

  if (!res.ok) {
    const err = await res.json().catch(() => null);
    return {
      ok: false,
      status: res.status,
      message: err?.message ?? '관리자 게시글 목록을 불러오지 못했습니다.',
    };
  }

  const data = (await res.json()) as PaginatedResponse<PostListItemResponse>;
  return { ok: true, data };
}

export async function activateAdminPost(postId: number): Promise<ApiResult<void>> {
  const res = await bffFetch(`/api/proxy/admin/posts/${postId}/activate`, {
    method: 'PATCH',
  });

  if (!res.ok) {
    const message = await readErrorMessage(res, '게시글 활성화에 실패했습니다.');
    return { ok: false, status: res.status, message };
  }

  return { ok: true, data: undefined };
}

export async function hideAdminPost(postId: number): Promise<ApiResult<void>> {
  const res = await bffFetch(`/api/proxy/admin/posts/${postId}/hide`, {
    method: 'PATCH',
  });

  if (!res.ok) {
    const message = await readErrorMessage(res, '게시글 비활성화에 실패했습니다.');
    return { ok: false, status: res.status, message };
  }

  return { ok: true, data: undefined };
}

export async function hardDeleteAdminPost(postId: number): Promise<ApiResult<void>> {
  const res = await bffFetch(`/api/proxy/admin/posts/${postId}`, {
    method: 'DELETE',
  });

  if (!res.ok) {
    const message = await readErrorMessage(res, '게시글 물리 삭제에 실패했습니다.');
    return { ok: false, status: res.status, message };
  }

  return { ok: true, data: undefined };
}
