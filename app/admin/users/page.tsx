'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import Pagination from '@/feature/post/list/Pagination';
import type { PaginatedResponse } from '@/feature/post/types';
import UserTable from '@/feature/admin/user/components/UserTable';
import {
  fetchAdminUsers,
  releaseAdminUserRejoinRestrictionByEmail,
  updateAdminUserStatus,
} from '@/feature/admin/user/api';
import type { AdminUserListItem, AdminUserStatus } from '@/feature/admin/user/types';

const STATUS_OPTIONS: { value: 'ALL' | AdminUserStatus; label: string }[] = [
  { value: 'ALL', label: '전체' },
  { value: 'ACTIVE', label: '활성' },
  { value: 'BLOCKED', label: '정지' },
  { value: 'PENDING', label: '대기' },
  { value: 'DELETED', label: '탈퇴' },
];

export default function AdminUsersPage() {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState<'ALL' | AdminUserStatus>('ALL');
  const [keyword, setKeyword] = useState('');
  const [page, setPage] = useState(0);
  const [data, setData] = useState<PaginatedResponse<AdminUserListItem> | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<number | null>(null);
  const [releaseEmail, setReleaseEmail] = useState('');
  const [releaseReason, setReleaseReason] = useState('');
  const [releaseLoading, setReleaseLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetchAdminUsers(page, 20, statusFilter, keyword.trim() || undefined);
    if (res.ok) {
      setData(res.data);
    } else if (res.status === 401 || res.status === 403) {
      toast.error('관리자 권한이 필요합니다.');
      router.push('/login');
    } else {
      toast.error(res.message ?? '관리자 유저 목록을 불러오지 못했습니다.');
      setData(null);
    }
    setLoading(false);
  }, [keyword, page, router, statusFilter]);

  useEffect(() => {
    load();
  }, [load]);

  const onStatusChange = useCallback(
    async (userId: number, status: AdminUserStatus, reason?: string | null) => {
      setActionId(userId);
      const res = await updateAdminUserStatus(userId, { status, reason });
      setActionId(null);

      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          toast.error('관리자 권한이 필요합니다.');
          router.push('/login');
          return;
        }
        toast.error(res.message ?? '상태 변경에 실패했습니다.');
        return;
      }

      toast.success('사용자 상태가 변경되었습니다.');
      load();
    },
    [load, router],
  );

  const onReleaseByEmail = useCallback(async () => {
    const trimmedEmail = releaseEmail.trim();
    if (!trimmedEmail) {
      toast.error('이메일을 입력해주세요.');
      return;
    }

    setReleaseLoading(true);
    const trimmedReason = releaseReason.trim();
    const res = await releaseAdminUserRejoinRestrictionByEmail(
      trimmedEmail,
      trimmedReason.length > 0 ? trimmedReason : null,
    );
    setReleaseLoading(false);

    if (!res.ok) {
      if (res.status === 401 || res.status === 403) {
        toast.error('관리자 권한이 필요합니다.');
        router.push('/login');
        return;
      }
      toast.error(res.message ?? '재가입 제한 해제에 실패했습니다.');
      return;
    }

    toast.success('재가입 제한이 해제되었습니다.');
    setReleaseEmail('');
    setReleaseReason('');
  }, [releaseEmail, releaseReason, router]);

  const emptyMessage = useMemo(() => {
    if (loading) return '';
    if (!data || data.content.length === 0) return '유저가 없습니다.';
    return '';
  }, [data, loading]);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900">유저 관리</h1>
          <p className="text-sm text-slate-500">유저 상태를 관리합니다.</p>
        </div>

        <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
            <select
              value={statusFilter}
              onChange={(event) => {
                setStatusFilter(event.target.value as 'ALL' | AdminUserStatus);
                setPage(0);
              }}
              className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm"
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <input
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              placeholder="이메일/닉네임 검색"
              className="h-10 flex-1 rounded-lg border border-slate-200 bg-white px-3 text-sm"
            />
          </div>
          <button
            onClick={() => {
              setPage(0);
              load();
            }}
            className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            검색
          </button>
        </div>

        <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-3 text-sm font-semibold text-slate-700">재가입 제한 해제</div>
          <div className="grid gap-3 md:grid-cols-[1.4fr_2fr_auto] md:items-end">
            <div className="space-y-1">
              <label htmlFor="release-email" className="text-xs font-medium text-slate-600">
                이메일
              </label>
              <input
                id="release-email"
                value={releaseEmail}
                onChange={(event) => setReleaseEmail(event.target.value)}
                placeholder="user@example.com"
                className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm"
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="release-reason" className="text-xs font-medium text-slate-600">
                해제 사유(선택)
              </label>
              <input
                id="release-reason"
                value={releaseReason}
                onChange={(event) => setReleaseReason(event.target.value)}
                placeholder="요청 확인 후 해제"
                className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm"
              />
            </div>
            <button
              onClick={onReleaseByEmail}
              disabled={releaseLoading}
              className="h-10 rounded-lg border border-amber-200 px-4 text-sm font-medium text-amber-700 hover:bg-amber-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {releaseLoading ? '해제 중...' : '제한 해제'}
            </button>
          </div>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 animate-pulse rounded-2xl bg-slate-200" />
            ))}
          </div>
        ) : !data ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
            데이터를 불러오지 못했습니다.
          </div>
        ) : data.content.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
            {emptyMessage}
          </div>
        ) : (
          <>
            <UserTable users={data.content} actionId={actionId} onStatusChange={onStatusChange} />
            <div className="mt-6">
              <Pagination
                currentPage={page}
                totalPages={data.totalPages}
                onPageChange={(next) => setPage(next)}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
