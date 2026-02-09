import { bffFetch } from '@/lib/bffFetch';
import type { ApiResult } from '@/types/http';
import type { PaginatedResponse, PostListItemResponse } from '@/feature/post/types';

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
