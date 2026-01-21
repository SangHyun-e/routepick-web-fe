import {
  CommentCreateRequest,
  CommentLikeToggleResponse,
  CommentResponse,
} from '@/feature/comment/types';
import { PaginatedResponse } from '@/feature/post/types';
import { bffFetch } from '@/lib/bffFetch';
import { ApiResult } from '@/types/http';

async function readErrorMessage(res: Response, fallback: string): Promise<string> {
  // 1) JSON {message} 우선
  try {
    const json = await res.clone().json();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const msg = (json as any)?.message;
    if (typeof msg === 'string' && msg.trim().length > 0) {
      return msg;
    }
  } catch {
    // ignore
  }

  // 2) text fallback
  try {
    const text = await res.clone().text();
    if (typeof text === 'string' && text.trim().length > 0) {
      return text;
    }
  } catch {
    // ignore
  }

  return fallback;
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

/** 댓글 목록(루트 + replies 포함) */
export async function fetchComment(
  postId: number,
  page: 0,
  size: 20,
): Promise<ApiResult<PaginatedResponse<CommentResponse>>> {
  const res = await bffFetch(`/api/proxy/posts/${postId}/comments?page=${page}&size=${size}`, {
    cache: 'no-store',
  });

  if (!res.ok) {
    const message = await readErrorMessage(res, `댓글을 불러오지 못했습니다. (${res.status})`);
    return { ok: false, status: res.status, message };
  }

  const raw = await res.json().catch(() => ({}));
  const data = normalizePage<CommentResponse>(raw);
  return { ok: true, data };
}

/** 본댓글 생성 */
export async function createRootComment(
  postId: number,
  payload: CommentCreateRequest,
): Promise<ApiResult<{ id: number }>> {
  const res = await bffFetch(`/api/proxy/posts/${postId}/comments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const message = await readErrorMessage(res, `댓글 생성 실패 (${res.status})`);
    return { ok: false, status: res.status, message };
  }

  const data = (await res.json()) as { id: number };
  return { ok: true, data };
}

/** 대댓글 생성 */
export async function createReplyComment(
  postId: number,
  parentId: number,
  payload: CommentCreateRequest,
): Promise<ApiResult<{ id: number }>> {
  const res = await bffFetch(`/api/proxy/posts/${postId}/comments/${parentId}/replies`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const message = await readErrorMessage(res, `대댓글 생성 실패 (${res.status})`);
    return { ok: false, status: res.status, message };
  }

  const data = (await res.json()) as { id: number };
  return { ok: true, data };
}

/** 댓글 좋아요 토글 */
export async function toggleCommentLike(
  postId: number,
  commentId: number,
): Promise<ApiResult<CommentLikeToggleResponse>> {
  const res = await bffFetch(`/api/proxy/posts/${postId}/comments/${commentId}/like`, {
    method: 'POST',
  });

  if (!res.ok) {
    const message = await readErrorMessage(res, `댓글 좋아요 실패 (${res.status})`);
    return { ok: false, status: res.status, message };
  }

  const data = (await res.json()) as CommentLikeToggleResponse;
  return { ok: true, data };
}

/** 댓글 삭제 */
export async function deleteComment(postId: number, commentId: number): Promise<ApiResult<null>> {
  const res = await bffFetch(`/api/proxy/posts/${postId}/comments/${commentId}`, {
    method: 'DELETE',
  });

  if (!res.ok) {
    const message = await readErrorMessage(res, `댓글 삭제 실패 (${res.status})`);
    return { ok: false, status: res.status, message };
  }
  return { ok: true, data: null };
}

/** 댓글 수정 */
export async function updateComment(
  postId: number,
  commentId: number,
  payload: CommentCreateRequest,
): Promise<ApiResult<CommentResponse>> {
  const res = await bffFetch(`/api/proxy/posts/${postId}/comments/${commentId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const message = await readErrorMessage(res, `댓글 수정 실패 (${res.status})`);
    return { ok: false, status: res.status, message };
  }

  const data = (await res.json()) as CommentResponse;
  return { ok: true, data };
}
