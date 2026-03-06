import { bffFetch } from '@/lib/bffFetch';
import type { ApiResult } from '@/types/http';
import type { PaginatedResponse } from '@/feature/post/types';
import type { NotificationResponse, NotificationSortOption } from '@/feature/notification/types';

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

export async function fetchNotifications(
  page = 0,
  size = 20,
  read?: boolean,
  sort: NotificationSortOption = 'latest',
): Promise<ApiResult<PaginatedResponse<NotificationResponse>>> {
  const params = new URLSearchParams();
  params.set('page', String(page));
  params.set('size', String(size));
  if (read !== undefined) {
    params.set('read', String(read));
  }

  const sortParam = sort === 'oldest' ? 'createdAt,asc' : 'createdAt,desc';
  params.append('sort', sortParam);

  const res = await bffFetch(`/api/proxy/notifications?${params.toString()}`, {
    cache: 'no-store',
  });

  if (!res.ok) {
    const message = await readErrorMessage(res, '알림을 불러오지 못했습니다.');
    return { ok: false, status: res.status, message };
  }

  const raw = await res.json().catch(() => ({}));
  const data = normalizePage<NotificationResponse>(raw);
  return { ok: true, data };
}

export async function markNotificationRead(
  notificationId: number,
): Promise<ApiResult<void>> {
  const res = await bffFetch(`/api/proxy/notifications/${notificationId}/read`, {
    method: 'PATCH',
  });

  if (!res.ok) {
    const message = await readErrorMessage(res, '알림 읽음 처리에 실패했습니다.');
    return { ok: false, status: res.status, message };
  }

  return { ok: true, data: undefined };
}

export async function markAllNotificationsRead(): Promise<ApiResult<void>> {
  const res = await bffFetch('/api/proxy/notifications/read-all', {
    method: 'PATCH',
  });

  if (!res.ok) {
    const message = await readErrorMessage(res, '알림 전체 읽음 처리에 실패했습니다.');
    return { ok: false, status: res.status, message };
  }

  return { ok: true, data: undefined };
}
