'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import Pagination from '@/feature/post/list/Pagination';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import UserStatusBadge from '@/feature/admin/user/components/UserStatusBadge';
import UserStatusAction from '@/feature/admin/user/components/UserStatusAction';
import UserStatusHistoryList from '@/feature/admin/user/components/UserStatusHistoryList';
import {
  fetchAdminUserDetail,
  fetchAdminUserStatusHistory,
  lockAdminUserRejoinRestriction,
  releaseAdminUserRejoinRestriction,
  updateAdminUserStatus,
} from '@/feature/admin/user/api';
import type {
  AdminUserDetail,
  AdminUserStatus,
  AdminUserStatusHistoryItem,
} from '@/feature/admin/user/types';
import type { PaginatedResponse } from '@/feature/post/types';

type PageProps = {
  params: { id: string };
};

function formatDateTime(iso: string) {
  const date = new Date(iso);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  return `${year}.${month}.${day} ${hh}:${mm}`;
}

export default function AdminUserDetailPage({ params }: PageProps) {
  const router = useRouter();
  const userId = Number(params.id);
  const [user, setUser] = useState<AdminUserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [actioning, setActioning] = useState(false);
  const [rejoinDialogOpen, setRejoinDialogOpen] = useState(false);
  const [rejoinLockDialogOpen, setRejoinLockDialogOpen] = useState(false);
  const [rejoinReleaseReason, setRejoinReleaseReason] = useState('');
  const [historyPage, setHistoryPage] = useState(0);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyData, setHistoryData] =
    useState<PaginatedResponse<AdminUserStatusHistoryItem> | null>(null);

  const loadUser = useCallback(async () => {
    setLoading(true);
    const res = await fetchAdminUserDetail(userId);
    if (res.ok) {
      setUser(res.data);
    } else if (res.status === 401 || res.status === 403) {
      toast.error('관리자 권한이 필요합니다.');
      router.push('/login');
    } else {
      toast.error(res.message ?? '사용자 정보를 불러오지 못했습니다.');
      setUser(null);
    }
    setLoading(false);
  }, [router, userId]);

  const loadHistory = useCallback(async () => {
    setHistoryLoading(true);
    const res = await fetchAdminUserStatusHistory(userId, historyPage, 20);
    if (res.ok) {
      setHistoryData(res.data);
    } else if (res.status === 401 || res.status === 403) {
      toast.error('관리자 권한이 필요합니다.');
      router.push('/login');
    } else {
      toast.error(res.message ?? '상태 변경 이력을 불러오지 못했습니다.');
      setHistoryData(null);
    }
    setHistoryLoading(false);
  }, [historyPage, router, userId]);

  useEffect(() => {
    if (!Number.isFinite(userId)) {
      return;
    }
    loadUser();
  }, [loadUser, userId]);

  useEffect(() => {
    if (!Number.isFinite(userId)) {
      return;
    }
    loadHistory();
  }, [loadHistory, userId]);

  const handleStatusChange = useCallback(
    async (status: AdminUserStatus, reason?: string | null) => {
      setActioning(true);
      const res = await updateAdminUserStatus(userId, { status, reason });
      setActioning(false);

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
      loadUser();
      loadHistory();
    },
    [loadHistory, loadUser, router, userId],
  );

  const handleReleaseRejoinRestriction = useCallback(async () => {
    setActioning(true);
    const trimmedReason = rejoinReleaseReason.trim();
    const res = await releaseAdminUserRejoinRestriction(
      userId,
      trimmedReason.length > 0 ? trimmedReason : null,
    );
    setActioning(false);
    setRejoinDialogOpen(false);
    setRejoinReleaseReason('');

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
    loadUser();
  }, [loadUser, rejoinReleaseReason, router, userId]);

  const handleLockRejoinRestriction = useCallback(async () => {
    setActioning(true);
    const res = await lockAdminUserRejoinRestriction(userId);
    setActioning(false);
    setRejoinLockDialogOpen(false);

    if (!res.ok) {
      if (res.status === 401 || res.status === 403) {
        toast.error('관리자 권한이 필요합니다.');
        router.push('/login');
        return;
      }
      toast.error(res.message ?? '재가입 제한 설정에 실패했습니다.');
      return;
    }

    toast.success('재가입 제한이 다시 설정되었습니다.');
    loadUser();
  }, [loadUser, router, userId]);

  const historyItems = useMemo(() => historyData?.content ?? [], [historyData]);
  const rejoinRestrictionLabel = useMemo(() => {
    if (!user?.rejoinRestrictedUntil) return '없음';
    if (user.rejoinRestrictionReleasedAt) {
      return `해제됨 (${formatDateTime(user.rejoinRestrictionReleasedAt)})`;
    }
    const untilTime = new Date(user.rejoinRestrictedUntil).getTime();
    if (Number.isNaN(untilTime)) {
      return '확인 불가';
    }
    if (untilTime <= Date.now()) {
      return `만료됨 (${formatDateTime(user.rejoinRestrictedUntil)})`;
    }
    return `제한 중 (${formatDateTime(user.rejoinRestrictedUntil)})`;
  }, [user]);
  const canReleaseRejoinRestriction = useMemo(() => {
    if (!user || user.status !== 'DELETED') return false;
    if (!user.rejoinRestrictedUntil || user.rejoinRestrictionReleasedAt) return false;
    const untilTime = new Date(user.rejoinRestrictedUntil).getTime();
    if (Number.isNaN(untilTime)) return false;
    return untilTime > Date.now();
  }, [user]);
  const canLockRejoinRestriction = useMemo(() => {
    if (!user || user.status !== 'DELETED') return false;
    if (!user.rejoinRestrictedUntil) return true;
    if (user.rejoinRestrictionReleasedAt) return true;
    const untilTime = new Date(user.rejoinRestrictedUntil).getTime();
    if (Number.isNaN(untilTime)) return false;
    return untilTime <= Date.now();
  }, [user]);

  if (!Number.isFinite(userId)) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-10 text-sm text-slate-500">
        잘못된 사용자 ID 입니다.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-5xl px-4 py-10">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">유저 상세</h1>
            <p className="text-sm text-slate-500">사용자 상태와 정보를 확인합니다.</p>
          </div>
          <Link href="/admin/users" className="text-sm text-blue-600 hover:underline">
            목록으로
          </Link>
        </div>

        {loading ? (
          <div className="h-32 animate-pulse rounded-2xl bg-slate-200" />
        ) : !user ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
            사용자 정보를 불러오지 못했습니다.
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-xl font-semibold text-slate-900">{user.nickname}</h2>
                  <UserStatusBadge status={user.status} />
                </div>
                <p className="text-sm text-slate-500">{user.email}</p>
                <p className="text-xs text-slate-400">
                  역할: {user.role} · 가입일: {formatDateTime(user.createdAt)}
                </p>
              </div>
              <UserStatusAction
                status={user.status}
                allowDelete
                disabled={actioning}
                onChangeStatus={handleStatusChange}
              />
            </div>
            <div className="mt-4 text-xs text-slate-400">
              인증 제공자: {user.authProvider} · 프로필 완료: {user.profileComplete ? 'Y' : 'N'}
              {user.updatedAt && <span> · 수정일: {formatDateTime(user.updatedAt)}</span>}
            </div>
            <div className="mt-4 space-y-2 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span>재가입 제한: {rejoinRestrictionLabel}</span>
                <div className="flex flex-wrap gap-2">
                  {canReleaseRejoinRestriction && (
                    <button
                      onClick={() => {
                        setRejoinReleaseReason('');
                        setRejoinDialogOpen(true);
                      }}
                      disabled={actioning}
                      className="rounded-md border border-amber-200 px-3 py-1 text-xs font-medium text-amber-700 hover:bg-amber-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      제한 해제
                    </button>
                  )}
                  {canLockRejoinRestriction && (
                    <button
                      onClick={() => setRejoinLockDialogOpen(true)}
                      disabled={actioning}
                      className="rounded-md border border-rose-200 px-3 py-1 text-xs font-medium text-rose-700 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      제한 설정
                    </button>
                  )}
                </div>
              </div>
              {user.withdrawReason && <p>탈퇴 사유: {user.withdrawReason}</p>}
              {user.rejoinRestrictionReleaseReason && (
                <p>해제 사유: {user.rejoinRestrictionReleaseReason}</p>
              )}
            </div>
          </div>
        )}

        <div className="mt-8 space-y-3">
          <h3 className="text-lg font-semibold text-slate-900">상태 변경 이력</h3>
          <UserStatusHistoryList history={historyItems} loading={historyLoading} />
          {historyData && historyData.totalPages > 1 && (
            <div className="pt-4">
              <Pagination
                currentPage={historyPage}
                totalPages={historyData.totalPages}
                onPageChange={(next) => setHistoryPage(next)}
              />
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={rejoinDialogOpen}
        onOpenChange={(open) => {
          setRejoinDialogOpen(open);
          if (!open) {
            setRejoinReleaseReason('');
          }
        }}
        title="재가입 제한을 해제하시겠습니까?"
        description={
          <div className="space-y-3">
            <p>해제하면 사용자가 바로 재가입할 수 있습니다.</p>
            <div className="space-y-1">
              <label htmlFor="rejoin-release-reason" className="text-xs font-medium text-slate-600">
                해제 사유(선택)
              </label>
              <textarea
                id="rejoin-release-reason"
                value={rejoinReleaseReason}
                onChange={(event) => setRejoinReleaseReason(event.target.value)}
                rows={3}
                className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
                placeholder="해제 사유를 입력하세요"
              />
            </div>
          </div>
        }
        confirmText="해제"
        confirmDisabled={actioning}
        onConfirm={handleReleaseRejoinRestriction}
      />

      <ConfirmDialog
        open={rejoinLockDialogOpen}
        onOpenChange={setRejoinLockDialogOpen}
        title="재가입 제한을 다시 설정할까요?"
        description="설정 시 7일 동안 재가입이 제한됩니다."
        confirmText="제한 설정"
        confirmDisabled={actioning}
        onConfirm={handleLockRejoinRestriction}
      />
    </div>
  );
}
