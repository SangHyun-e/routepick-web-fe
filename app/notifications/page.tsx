'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';

import type { PaginatedResponse } from '@/feature/post/types';
import type { NotificationResponse } from '@/feature/notification/types';
import {
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '@/feature/notification/api';

function formatDateTime(iso: string) {
  const date = new Date(iso);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  return `${year}.${month}.${day} ${hh}:${mm}`;
}

function resolveNotificationLink(notification: NotificationResponse) {
  if (notification.resourceType === 'POST' && notification.resourceId) {
    return `/posts/${notification.resourceId}`;
  }
  if (notification.resourceType === 'COURSE') {
    return '/drive';
  }
  if (notification.resourceType === 'ACCOUNT') {
    return '/me';
  }
  if (notification.resourceType === 'NOTICE') {
    return '/posts';
  }
  if (notification.resourceType === 'ADMIN') {
    return '/me';
  }
  return null;
}

export default function NotificationsPage() {
  const [data, setData] = useState<PaginatedResponse<NotificationResponse> | null>(null);
  const [items, setItems] = useState<NotificationResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);

  const loadNotifications = useCallback(async (page = 0, append = false) => {
    if (append) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }

    const res = await fetchNotifications(page, 20);
    if (!res.ok) {
      toast.error(res.message ?? '알림을 불러오지 못했습니다.');
      setLoading(false);
      setLoadingMore(false);
      return;
    }

    setData(res.data);
    setItems((prev) => (append ? [...prev, ...res.data.content] : res.data.content));
    setLoading(false);
    setLoadingMore(false);
  }, []);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const handleMarkRead = async (notificationId: number) => {
    const res = await markNotificationRead(notificationId);
    if (!res.ok) {
      toast.error(res.message ?? '읽음 처리에 실패했습니다.');
      return;
    }
    setItems((prev) =>
      prev.map((item) => (item.id === notificationId ? { ...item, read: true } : item)),
    );
  };

  const handleMarkAll = async () => {
    setMarkingAll(true);
    const res = await markAllNotificationsRead();
    setMarkingAll(false);
    if (!res.ok) {
      toast.error(res.message ?? '전체 읽음 처리에 실패했습니다.');
      return;
    }
    setItems((prev) => prev.map((item) => ({ ...item, read: true })));
  };

  const handleLoadMore = () => {
    if (!data || data.last) return;
    loadNotifications(data.number + 1, true);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-4xl px-4 py-10">
        <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">알림</h1>
            <p className="text-sm text-slate-500">최근 알림을 확인하세요.</p>
          </div>
          <button
            type="button"
            onClick={handleMarkAll}
            disabled={markingAll || items.length === 0}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {markingAll ? '처리 중...' : '전체 읽음 처리'}
          </button>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, index) => (
              <div key={index} className="h-20 animate-pulse rounded-xl bg-slate-200" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
            아직 받은 알림이 없습니다.
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((item) => {
              const link = resolveNotificationLink(item);
              return (
                <div
                  key={item.id}
                  className={`rounded-2xl border p-4 shadow-sm ${
                    item.read ? 'border-slate-200 bg-white' : 'border-slate-300 bg-slate-50'
                  }`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                      <p className="text-sm text-slate-600">{item.message}</p>
                      <p className="text-xs text-slate-400">{formatDateTime(item.createdAt)}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {link && (
                        <Link
                          href={link}
                          className="rounded-md border border-slate-200 px-3 py-1 text-xs text-slate-600 hover:bg-slate-100"
                        >
                          바로가기
                        </Link>
                      )}
                      {!item.read && (
                        <button
                          type="button"
                          onClick={() => handleMarkRead(item.id)}
                          className="rounded-md bg-slate-900 px-3 py-1 text-xs text-white hover:bg-slate-800"
                        >
                          읽음 처리
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {data && !data.last && (
          <div className="mt-6 flex justify-center">
            <button
              type="button"
              onClick={handleLoadMore}
              disabled={loadingMore}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loadingMore ? '불러오는 중...' : '더보기'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
