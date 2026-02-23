import { bffFetch } from '@/lib/bffFetch';
import type { ApiResult } from '@/types/http';
import type { PaginatedResponse } from '@/feature/post/types';
import type {
  AdminUserDetail,
  AdminUserListItem,
  AdminUserStatusHistoryItem,
  AdminUserStatusUpdateRequest,
} from '@/feature/admin/user/types';

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

export async function fetchAdminUsers(
  page = 0,
  size = 20,
  status?: string,
  keyword?: string,
): Promise<ApiResult<PaginatedResponse<AdminUserListItem>>> {
  const params = new URLSearchParams();
  params.set('page', String(page));
  params.set('size', String(size));
  if (keyword) {
    params.set('q', keyword);
  }
  if (status && status !== 'ALL') {
    params.set('status', status);
  }

  const res = await bffFetch(`/api/proxy/admin/users?${params.toString()}`, {
    cache: 'no-store',
  });

  if (!res.ok) {
    const message = await readErrorMessage(res, '관리자 유저 목록을 불러오지 못했습니다.');
    return { ok: false, status: res.status, message };
  }

  const data = (await res.json()) as PaginatedResponse<AdminUserListItem>;
  return { ok: true, data };
}

export async function fetchAdminUserDetail(
  userId: number,
): Promise<ApiResult<AdminUserDetail>> {
  const res = await bffFetch(`/api/proxy/admin/users/${userId}`, {
    cache: 'no-store',
  });

  if (!res.ok) {
    const message = await readErrorMessage(res, '관리자 유저 정보를 불러오지 못했습니다.');
    return { ok: false, status: res.status, message };
  }

  const data = (await res.json()) as AdminUserDetail;
  return { ok: true, data };
}

export async function updateAdminUserStatus(
  userId: number,
  payload: AdminUserStatusUpdateRequest,
): Promise<ApiResult<void>> {
  const res = await bffFetch(`/api/proxy/admin/users/${userId}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const message = await readErrorMessage(res, '상태 변경에 실패했습니다.');
    return { ok: false, status: res.status, message };
  }

  return { ok: true, data: undefined };
}

export async function fetchAdminUserStatusHistory(
  userId: number,
  page = 0,
  size = 20,
): Promise<ApiResult<PaginatedResponse<AdminUserStatusHistoryItem>>> {
  const params = new URLSearchParams();
  params.set('page', String(page));
  params.set('size', String(size));

  const res = await bffFetch(
    `/api/proxy/admin/users/${userId}/status-history?${params.toString()}`,
    { cache: 'no-store' },
  );

  if (!res.ok) {
    const message = await readErrorMessage(res, '상태 변경 이력을 불러오지 못했습니다.');
    return { ok: false, status: res.status, message };
  }

  const data = (await res.json()) as PaginatedResponse<AdminUserStatusHistoryItem>;
  return { ok: true, data };
}
