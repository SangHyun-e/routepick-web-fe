import { bffFetch } from '@/lib/bffFetch';
import type { MyCommentListItem } from '@/feature/comment/types';
import type { PaginatedResponse, PostListItemResponse } from '@/feature/post/types';
import type { ApiResult } from '@/types/http';

function normalizePage<T>(raw: unknown): PaginatedResponse<T> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = raw as any;
  const content = Array.isArray(result?.content) ? (result.content as T[]) : [];
  return {
    content,
    number: Number.isFinite(result?.number) ? result.number : 0,
    size: Number.isFinite(result?.size) ? result.size : content.length,
    totalElements: Number.isFinite(result?.totalElements) ? result.totalElements : content.length,
    totalPages: Number.isFinite(result?.totalPages) ? result.totalPages : 1,
    first: Boolean(result?.first),
    last: Boolean(result?.last),
    numberOfElements: Number.isFinite(result?.numberOfElements)
      ? result.numberOfElements
      : content.length,
    empty: content.length === 0,
  };
}

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

export async function fetchMyPosts(
  page = 0,
  size = 3,
  status: 'ALL' | 'ACTIVE' | 'HIDDEN' = 'ALL',
): Promise<ApiResult<PaginatedResponse<PostListItemResponse>>> {
  const params = new URLSearchParams();
  params.set('page', String(page));
  params.set('size', String(size));
  params.append('sort', 'createdAt,desc');
  if (status !== 'ALL') {
    params.set('status', status);
  }

  const res = await bffFetch(`/api/proxy/users/me/posts?${params.toString()}`, {
    cache: 'no-store',
  });

  if (!res.ok) {
    const message = await readErrorMessage(
      res,
      `내 게시글을 불러오지 못했습니다. (${res.status})`,
    );
    return { ok: false, status: res.status, message };
  }

  const raw = await res.json().catch(() => ({}));
  const data = normalizePage<PostListItemResponse>(raw);
  return { ok: true, data };
}

export async function fetchMyComments(
  page = 0,
  size = 3,
): Promise<ApiResult<PaginatedResponse<MyCommentListItem>>> {
  const params = new URLSearchParams();
  params.set('page', String(page));
  params.set('size', String(size));
  params.append('sort', 'createdAt,desc');

  const res = await bffFetch(`/api/proxy/users/me/comments?${params.toString()}`, {
    cache: 'no-store',
  });

  if (!res.ok) {
    const message = await readErrorMessage(
      res,
      `내 댓글을 불러오지 못했습니다. (${res.status})`,
    );
    return { ok: false, status: res.status, message };
  }

  const raw = await res.json().catch(() => ({}));
  const data = normalizePage<MyCommentListItem>(raw);
  return { ok: true, data };
}

export async function activateMyPost(postId: number): Promise<ApiResult<void>> {
  const res = await bffFetch(`/api/proxy/posts/${postId}/activate`, { method: 'PATCH' });

  if (!res.ok) {
    const message = await readErrorMessage(res, '게시글 활성화 실패');
    return { ok: false, status: res.status, message };
  }

  return { ok: true, data: undefined };
}

export async function hideMyPost(postId: number): Promise<ApiResult<void>> {
  const res = await bffFetch(`/api/proxy/posts/${postId}/hide`, { method: 'PATCH' });

  if (!res.ok) {
    const message = await readErrorMessage(res, '게시글 숨김 실패');
    return { ok: false, status: res.status, message };
  }

  return { ok: true, data: undefined };
}

export async function withdrawUser(): Promise<ApiResult<void>> {
  const res = await bffFetch('/api/proxy/users/me', { method: 'DELETE' });

  if (!res.ok) {
    const message = await res
      .json()
      .then((body) => body?.message as string | undefined)
      .catch(() => undefined);
    return {
      ok: false,
      status: res.status,
      message: message ?? '회원 탈퇴에 실패했습니다.',
    };
  }

  return { ok: true, data: undefined };
}

export async function verifyPassword(password: string): Promise<ApiResult<void>> {
  const res = await bffFetch('/api/proxy/users/me/verify-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password }),
  });

  if (!res.ok) {
    const message = await res
      .json()
      .then((body) => body?.message as string | undefined)
      .catch(() => undefined);
    return {
      ok: false,
      status: res.status,
      message: message ?? '비밀번호 확인에 실패했습니다.',
    };
  }

  return { ok: true, data: undefined };
}

export async function updateMyNickname(nickname: string): Promise<ApiResult<void>> {
  const res = await bffFetch('/api/proxy/users/me/nickname', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nickname }),
  });

  if (!res.ok) {
    const message = await readErrorMessage(res, '닉네임 변경에 실패했습니다.');
    return { ok: false, status: res.status, message };
  }

  return { ok: true, data: undefined };
}
